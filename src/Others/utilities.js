function isUrlValid(url) {
    return URL.canParse(url);
}

function handleUrlWithoutProtocol(url) {
    if (!isUrlValid(url)) {
        const urlWithoutHttp = new RegExp('/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/[a-zA-Z0-9@:%._\+~#?&//=]*)?$', 'i');
        const isRawUrl = urlWithoutHttp.test(url);
        
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