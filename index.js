const sizeOf = require('image-size');
const request = require('sync-request');
var url = require('url');
var path = require('path');
var fs = require('fs');

const isUrlString = str => {
    return !!url.parse(str).slashes
}

const getImageSizeFromUrl_Path = (src) => {
    const ops = url.parse(src);
    return ops.slashes ? getImgSizeFromURL(src) : getImgSizeFromPath(src)
}

const getImageSizeFromUrl_PathSync = (src, log) => {
    const ops = url.parse(src);
    return ops.slashes ? getImgSizeFromURLSync(src, log) : getImgSizeFromPathSync(src, log);
}

const getImgSizeFromURL = (url) => {
    const ops = url.parse(imgUrl);
    const protocol = ops.protocol.replace(/:$/, '');
    let protocolPackage;
    if (protocol === 'http' || protocol === 'https') {
        protocolPackage = require(protocol);
    } else {
        return Promise.reject("illegal protocol: " + protocol)
    }

    return new Promise( function (resolve, reject) {
        protocolPackage.get(url, function (res) {
            let statusCode = res.statusCode;
            if (statusCode === 302 || statusCode === 301) {
                console.log(url, statusCode, "=>", res.headers['location']);
                return getImgSizeFromURL(res.headers['location'])
            }
            const chunks = []
            res.on('data', function (chunk) {
                chunks.push(chunk);
            }).on('end', () => {
                const buffer = Buffer.concat(chunks);
                const size = sizeOf(buffer);
                console.log(url, "<=>", size);
                resolve(size);
            })
        }).on('error', (err) => reject(err.message))
    })
}

const getImgSizeFromURLSync = (url, log) => {
    try {
        const res = request('GET', url);
        const size = sizeOf(res.getBody());
        log && console.log("[URL]", url, '<=>', size);
        return size;
    } catch (ex) {
        log && console.error(ex.message);
        return null;
    }
}

const getImgSizeFromPath = (path) => {
    return new Promise((resolve, reject) => {
        sizeOf(path, (err, size) => {
            if (err) reject(err.message);
            else {
                console.log(path, "<=>", reject)
                resolve(size);
            }
        })
    })
}

const getImgSizeFromPathSync = (path, log) => {
    try {
        const size = sizeOf(path);
        log && console.log("[PATH]", path, '<=>', size);
        return size;
    } catch (ex) {
        log && console.error(ex.message);
        return null;
    }
}

const setMarkDownImageSize = (markdown, options) => {
    var file = options.file || '';
    var log = options.log || false;
    var ignoreRelative = options.ignoreRelative || false;
    var source = (options.source && options.source.replace(/\/+$/, '')) || '';
    source += '/';
    var bsname = path.basename(file);
    markdown = markdown.replace(/<img([\s\S]+?)>([^<]*<\/\s*?img>)*/g, (m, c, other) => {
        if (c.includes(' width=') && c.includes(' height=')) {
            log && console.log(`[SKIP] ${bsname} (had size) => ` + m);
            return m;
        }
        if ( /src=["']([\s\S]+?)["']/.test(c) ) {
            let src = RegExp.$1;
            if (ignoreRelative && !isUrlString(src)) {
                log && console.log(`[SKIP] ${bsname} (ignore) => ` + m);
                return m;
            }
            src = source + src.replace(/^\/+/, '');
            let size;
            if (isUrlString(src)) {
                size = getImageSizeFromUrl_PathSync(src, log);
            } else {
                size = getImgSizeFromPathSync(src, log);
            }
            if (!size) {
                log && console.error(`[ERROR] ${bsname} => ${m}`);
                return m;
            } else if (c.includes(' width=') || c.includes(' height=')) {
                c = c.replace(/ (width|height)=[^\/\s]+/, ` width="${size.width}" height="${size.height}"`)
            } else {
                c=` width="${size.width}" height="${size.height}"`+c;
            }
            return size ? `<img${c}>${other || ''}` : m;
        } else {
            log && console.log(`[SKIP] ${bsname} (no src) => ` + m);
            return m;
        }
    });

    return markdown.replace(/!\[([\s\S]*?)\]\(([\s\S]*?)\)/g, (m, alt, src) => {
        if (src) {
            if (ignoreRelative && !isUrlString(src)) {
                log && console.log(`[SKIP] ${bsname} (ignore) => ` + m);
                return m;
            }
            src = source + src.replace(/^\/+/, '');
            let size;
            if (isUrlString(src)) {
                size = getImageSizeFromUrl_PathSync(src, log);
            } else {
                if (ignoreRelative) {
                    log && console.log(`[SKIP] ${bsname} (ignore) => ` + m);
                    return m;
                }
                size = getImgSizeFromPathSync(src, log);
            }
            if (!size) {
                log && console.error(`[ERROR] ${bsname} => ${m}`)
            }
            return size ? `<img src="${src}" alt="${alt}" width="${size.width}" height="${size.height}" />` : m;
        } else {
            log && console.log(`[SKIP] ${bsname} (no src) => ` + m);
            return m;
        }
        return m;
    })
}



module.exports = markDownImageSize = function (markdown, options) {
    return setMarkDownImageSize(markdown, options);
}

module.exports.markDownImageSizeFromPath = function (file, options) {
    var str = fs.readFileSync(file).toString();
    options.file = file;
    return setMarkDownImageSize(str, options);
}

