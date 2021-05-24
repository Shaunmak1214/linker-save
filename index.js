const express = require('express');
const axios = require('axios');
const Discord = require('discord.js');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
require('dotenv').config()

const { prefix, RaindropBase } = require('./config.json');
const { createUser, getAccessTokenViaDiscordId } = require('./controllers/user.controller');
const { createCollection} = require('./controllers/collection.controller');
const { getTitleByUrl } = require('./controllers/open-graph.controller')
// Database
const db = require('./config/database');

// Database Authentication
db.sync({ alter:true })
.then((synched) => {
    console.log(`${synched} All models were synchronized successfully.`)
})
.catch((err) => {
    console.log(err)
})

db.authenticate()
  .then(() => console.log('Database connected...'))
  .catch(err => console.log('Error: ' + err))

function parseCookies(str) {
    let rx = /([^;=\s]*)=([^;]*)/g;
    let obj = { };
    for ( let m ; m = rx.exec(str) ; )
        obj[ m[1] ] = decodeURIComponent( m[2] );
    return obj;
}

let app = express();

// set the view engine to ejs
app.set('views', './views');
app.set('view engine', 'ejs');

app.use(bodyParser.json())

app.use(cookieParser());

/* ============================= Routes to ejs templating  ============================= */
app.use( express.static( "public" ) );

app.get('/', function(req, res) {


    res.render('index');
});

app.get('/auth/redirect', function(req, res) {

    var discord_user_id = req.query.discord_user_id
    var cookie = req.cookies.discord_user_id;
    res.cookie('discord_user_id',discord_user_id, { maxAge: 900000, httpOnly: true });

    res.writeHead(301,{
        Location: 'https://www.google.com'
    });

    res.end();
})

app.get('/auth/callback', async function(req, res) {

    let discord_user_id = parseCookies( req.headers.cookie ).discord_user_id;

    var data = JSON.stringify(
        {
            "grant_type": "authorization_code",
            "code": `${req.query.code}`,
            "client_id": "602ce67ff5b1b0e7483b1132",
            "client_secret": "7e9a5612-1c06-4dd8-9aa1-3544d2a37d09",
            "redirect_uri": "https://linksaverbot.herokuapp.com/auth/callback"
        }
    );

    var config = {
        method: 'post',
        url: 'https://raindrop.io/oauth/access_token',
        headers: { 
            'Content-Type': 'application/json', 
        },
        data : data
    };

    let access_token = await axios(config)
        .then(function (res) {
            return res.data.access_token;
        })
        .catch(function (err) {
            return err;
        });

    let tokenSaved = await createUser(discord_user_id, access_token)
        .then((res) => {
            if(res.data === 1){
                return 'User is already registered'
            }else if(res){
                return 'Account Registered'
            }else if(!res){
                return 'Account Not Registered'
            }

            res.clearCookie('discord_user_id')

        })
        .catch((err) => {
            console.log(err)
            return 'An Error has occured'
        })

    res.render('callback', { access_token: `${access_token}`, token_saved: tokenSaved });
});

app.use((req, res, next) => {
    res.status(404).send('We think you are lost!')
})

app.use((err, req, res, next) => {
    console.error(err.stack)
})


/* ============================= Discord Client Commands ============================= */
const client = new Discord.Client();

client.once('ready', () => {
    console.log(`Ready!`);
});

client.on("ready", () =>{
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setPresence({
        status: "idle",  // You can show online, idle... Do not disturb is dnd
        game: {
            name: "!help",  // The message shown
            type: "WATCHING" // PLAYING, WATCHING, LISTENING, STREAMING,
        }
    });
    client.user.setActivity("Saving Links ... "); 
});

client.on('message', async message => {
    if(message.content.startsWith(`${prefix}s`)){

        let access_token = await getAccessTokenViaDiscordId(message.author.id)
        if(!access_token){
            let text = "You're not authenticated, go to this link ( https://raindrop.io/oauth/authorize?redirect_uri=https://linksaverbot.herokuapp.com/auth/callback&client_id=602ce67ff5b1b0e7483b1132 ) to obtain your access token, then `token [your_access_token] to set your token to be authenticated";
            sendMessagePrivately(message.author.id, text)
            return;
        }

        let linkcat = message.content.substring(2).trim();

        let catdelimter1 = linkcat.indexOf('[');
        let catdelimter2 = linkcat.indexOf(']');

        let categoryWTags = linkcat.slice(catdelimter1, catdelimter2 + 1);
        let category = categoryWTags.slice(1, -1).split(/\s+/).join('').toLowerCase()

        let control = 0;
        let links = linkcat.replace(categoryWTags, "").trim()
        let linksArr = links.split(/(\s+)/).filter( 
            function(e) { 

                let checkLegitUrl = e.startsWith('https://') || e.startsWith('http://');

                if(!checkLegitUrl && control === 0){
                    message.channel.send('Only valid links starts with "https or http" will be saved')
                    control = 1;
                }

                return checkLegitUrl && e.trim().length > 0; 
            } 
        );

        /* console.log(category)
        console.log(linksArr) */

        axios.get(`${RaindropBase}collections`, {
            headers: { 
                'Authorization': `Bearer ${access_token}`, 
            }
        })
            .then(async (res) => {
                let catId = null;
                let catTitle = null;
                res.data.items.map(collection => {
                    if(collection.title.toLowerCase().split(/\s+/).join('') === category){
                        catTitle = collection.title
                        catId = collection._id;
                    }
                });

                if(catId === null ){
                    newCat = await createCollection(category, access_token)
                    catId = newCat.item._id;
                    catTitle = newCat.item.title
                }

                let body = null;
                let route = null;

                if(linksArr.length > 1){
                    let items = [];
                    route = 'raindrops'

                    for await (const link of linksArr) {
                        let pageTitle = await getTitleByUrl(link);

                        items.push({ 
                            "link": `${link}`, 
                            "title": `${pageTitle}`, 
                            "collection": {
                                "$id": catId
                            } 
                        })
                    }
                    body = {
                        items: items,
                    }
                }else{

                    let pageTitle = await getTitleByUrl(linksArr[0]);           

                    body = {
                        "link": `${linksArr[0]}`,
                        "title": `${pageTitle}`,
                        "collection": {
                            "$id": catId
                        }
                    }

                    route = 'raindrop'
                }
            
                body = JSON.stringify(body);

                var config = {
                    method: 'post',
                    url: `${RaindropBase}${route}`,
                    headers: { 
                        'Authorization': `Bearer ${access_token}`, 
                        'Content-Type': 'application/json', 
                    },
                    data: body
                };

                axios(config)
                    .then(function (res) {
                        if(res.data.result === true){
                            message.channel.send(`Link saved to ${catTitle}`); 
                            return;
                        }else{
                            message.channel.send(`Link saved failed`); 
                        }
                    })
                    .catch(function (err) {
                        message.channel.send(`Link saved failed ${err}`); 
                    });
            })
            .catch((err) => {
                console.log(err);
            })
    }else if(message.content.startsWith(`${prefix}token`)){
        let new_user_access_token = message.content.substring(6).trim();
        let newUser = await createUser(message.author.id, new_user_access_token);

        if(newUser === true){
            message.channel.send(`Accound Created, Access Token Saved`); 
            return;
        }else if(newUser === 1){
            message.channel.send(`Account is already a registered user`); 
            return;
        }else{
            message.channel.send(`404. There is some problem`); 
            return;
        }

    }else if(message.content.startsWith(`${prefix}test`)){
        let text = 'Hello';
        sendMessagePrivately(message.author.id, text)

        message.channel.send(`!play`);
    }
});

const sendMessagePrivately = async (discord_user_id, message) => {
    client.users.fetch(discord_user_id, false).then((user) => {
        user.send(message);
    });
}

client.login(process.env.TOKEN);

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.info(`Server has started on ${PORT}`))