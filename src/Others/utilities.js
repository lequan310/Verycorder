function isUrlValid(url) {
    return URL.canParse(url);
}

function handleUrlWithoutProtocol(url) {
    if (!isUrlValid(url)) {
        const urlWithoutHttp = /^(?!:\/\/)([a-zA-Z0-9]+\.)?[a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,6}?$/;
        const isRawUrl = urlWithoutHttp.exec(url);
        
        if (isRawUrl) {
            url = `http://` + url;
        }
    }
    return url;
}

module.exports = {
    isUrlValid,
    handleUrlWithoutProtocol,
}