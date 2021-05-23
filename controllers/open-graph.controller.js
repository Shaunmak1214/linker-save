const ogs = require('open-graph-scraper');

const getTitleByUrl = async(url) => {
    const options = { url };
    results = await ogs(options)
        .then((data) => {
            const { error, result, response } = data;

            if(error === true){
                return url;
            }else{
                return result.ogTitle
            }
        })
        .catch((err) => {
            console.log(err)
            return url;
        })

    return results;
}

module.exports = {
    getTitleByUrl
}