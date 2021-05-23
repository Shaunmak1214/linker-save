const { RaindropBase } = require('../config.json');
const catchAsync = require('../utils/catchAsync');
const axios = require('axios');

/* const checkCollectionExist = async(collection_name) => {

}
 */
const createCollection = async(collection_name, access_token) => {

    var data = JSON.stringify(
        {
            title: collection_name
        }
    )

    var config = {
        method: 'post',
        url: `${RaindropBase}collection`,
        headers: { 
            'Authorization': `Bearer ${access_token}`, 
            'Content-Type': 'application/json', 
        },
        data : data
    };

    newCollection = await axios(config)
        .then((res) => {
            return res.data
        })
        .catch((err) => {
            return err
        })

    return newCollection;
}

module.exports = {
    /* checkCollectionExist, */
    createCollection
}