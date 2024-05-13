function handleUrl(url) {
    if(URL.canParse(url)) {
        return url;
    } else {
        const urlWithoutProtocol = /^(?!:\/\/)([a-zA-Z0-9]+\.)?[a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,6}?$/i;
        const isUrl = urlWithoutProtocol.exec(url);

        if(isUrl) {
            url = `http://` + url;
            return url;
        } else {
            return null;
        }
    }
}

module.exports = {
    handleUrl
}