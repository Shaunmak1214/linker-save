const ogs = require('open-graph-scraper');

const getTitleByUrl = async(url) => {
    const options = { url };
    results = await ogs(options)
        .then((data) => {
            const { error, result, response } = data;

            if(error === true){
                return null;
            }else{
                return result.ogTitle
            }
        })

    return results;
}

module.exports = {
    getTitleByUrl
}