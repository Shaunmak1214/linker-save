let express = require('express');
const axios = require('axios');
const Discord = require('discord.js');
const { prefix, RaindropBase } = require('./config.json');
let bodyParser = require('body-parser');
require('dotenv').config()

let app = express();
app.use(bodyParser.json())

app.use((req, res, next) => {
    res.status(404).send('We think you are lost!')
})

app.use((err, req, res, next) => {
    console.error(err.stack)
})

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
        if(message.author.id === '312970409932881921'){
            let linkcat = message.content.substring(2).trim();
            linkcat = linkcat.split(" ");

            axios.get(`${RaindropBase}collections`, {
                headers: { 
                    'Authorization': 'Bearer 2d9e74ad-649f-42c5-b1a6-3bbdba862d65', 
                }
            })
                .then((res) => {
                    let catId = null;
                    res.data.items.map(collection => {
                        if(collection.title.toLowerCase() === linkcat[0]){
                            catId = collection._id;
                        }
                    });
                    
                    let body = {
                        "link": `${linkcat[1]}`,
                        "collection": {
                            "$id": catId
                        }
                    }
                    body = JSON.stringify(body);

                    var config = {
                        method: 'post',
                        url: `${RaindropBase}raindrop`,
                        headers: { 
                          'Authorization': 'Bearer 2d9e74ad-649f-42c5-b1a6-3bbdba862d65', 
                          'Content-Type': 'application/json', 
                        },
                        data : body
                    };

                    axios(config)
                        .then(function (res) {
                            if(res.data.result === true){
                                message.channel.send(`Link saved to ${linkcat[0]}`); 
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
        }
    }
});

client.login(process.env.TOKEN);

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.info(`Server has started on ${PORT}`))