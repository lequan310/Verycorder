function handleUrl(url) {
    if(URL.canParse(url)) {
        return url;
    } else {
        url = `http://` + url;
        if(URL.canParse(url)) {
            return url;
        }
    }

    return null;
}

module.exports = {
    handleUrl
}