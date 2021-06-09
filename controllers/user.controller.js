const { default: axios } = require('axios');
const User = require('../models/user.model');

const createUser = async(discord_user_id, access_token) => {
    const userExisted = await User.findAll({
        where: {
            discord_user_id: `${discord_user_id}`
        }
    })

    if(userExisted.length > 0){
        return 1;
    }else {
        const newUser = await User.create({ discord_user_id, access_token })

        if(newUser) {
            return true
        }else{
            return null
        }
    }
}

const getAccessTokenViaDiscordId = async (discord_id) => {
    const access_token = await User.findAll({
        where: {
            discord_user_id: `${discord_id}`
        }
    })

    if(access_token.length > 0){
        return access_token[0].dataValues.access_token;
    }else{
        return null;
    }
}

const getUserIdViaDiscordId = async (discord_id) => {
    const userId = await User.findAll({
        where: {
            discord_user_id: `${discord_id}`
        }
    })

    if(userId.length > 0){
        return userId[0].dataValues.user_id;
    }else{
        return null;
    }
}

const updateAllAccessToken = async(req, res) => {
    let updatedUsers = 0;
    const userList = await User.findAll();

    let updateAllUsers = new Promise((resolve, reject) => {
        userList.forEach( async(user, index, array) => {
            if(user.dataValues.refresh_token){
                var data = JSON.stringify(
                    {
                        "grant_type": "refresh_token",
                        "client_id": "602ce67ff5b1b0e7483b1132",
                        "client_secret": "7e9a5612-1c06-4dd8-9aa1-3544d2a37d09",
                        "refresh_token": `${user.dataValues.refresh_token}`
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
        
                await axios(config)
                    .then((res) => {
                        User.update(
                            {
                                access_token: res.data.access_token,
                                refresh_token: res.data.refresh_token
                            },
                            {
                                where:{
                                    user_id: user.dataValues.user_id
                                }
                            }
                        ).then((res) => {
                            updatedUsers++;
                        })
                        .catch((err) => {
                            console.log(err)
                        })
                    })
                    .catch((err) => {
                        console.log(err)
                    })
            }

            if (index === array.length -1) resolve();
        });
    });

    updateAllUsers.then(() => {
        res.send(`${updatedUsers} users' access token updated`)
    })

}

module.exports = {
    createUser,
    getAccessTokenViaDiscordId,
    getUserIdViaDiscordId,
    updateAllAccessToken
}