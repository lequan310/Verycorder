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

// function handleUrlWithoutProtocol(url) {
//     if (!isUrlValid(url)) {
//         const urlWithoutHttp = /^(?!:\/\/)([a-zA-Z0-9]+\.)?[a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,6}?$/;
//         const isRawUrl = urlWithoutHttp.exec(url);
        
//         if (isRawUrl) {
//             url = `http://` + url;
//         }
//     }
//     return url;
// }

module.exports = {
    handleUrl
}