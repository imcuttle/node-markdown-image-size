const sizeOf = require('image-size');
const request = require('sync-request');
var url = require('url');
var path = require('path');
var fs = require('fs');

const isUrlString = function (str) {
  return !!url.parse(str).slashes || str.startsWith('//')
}

const getImageSizeFromUrl_Path = function (src) {
  return isUrlString(src) ? getImgSizeFromURL(src) : getImgSizeFromPath(src)
}

const getImageSizeFromUrl_PathSync = function (src, log) {
  const ops = url.parse(src);
  return ops.slashes ? getImgSizeFromURLSync(src, log) : getImgSizeFromPathSync(src, log);
}

const getImgSizeFromURL = function (url) {
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
      }).on('end', function () {
        const buffer = Buffer.concat(chunks);
        const size = sizeOf(buffer);
        console.log(url, "<=>", size);
        resolve(size);
      })
    }).on('error', reject)
  })
}

const urlCache = {}
const getImgSizeFromURLSync = function (url, log) {
  return getOrSetCache(url, log, function () {
    try {
      const res = request('GET', url);
      const size = sizeOf(res.getBody());
      log && console.log("[URL]", url, '<=>', size);
      return size;
    } catch (ex) {
      log && console.error(ex.message);
    }
  }, urlCache)
}

const getImgSizeFromPath = function (path) {
  return new Promise(function (resolve, reject) {
    sizeOf(path, function (err, size) {
      if (err) reject(err.message);
      else {
        console.log(path, "<=>", reject)
        resolve(size);
      }
    })
  })
}

function getOrSetCache(key, log, getter, cache) {
  if (cache[key]) {
    log && console.log('use cache => key:', key, ', value:', cache[key])
    return cache[key]
  }
  const val = getter(key)
  if (typeof val !== 'undefined') {
    cache[key] = val
    return val
  }
  return null
}

const pathCache = {}
const getImgSizeFromPathSync = function (path, log) {
  return getOrSetCache(path, log, function () {
    try {
      const size = sizeOf(path);
      log && console.log("[PATH]", path, '<=>', size);
      return size;
    } catch (ex) {
      log && console.error(ex.message);
    }
  }, pathCache)
}

function join(source, src) {
  if (isUrlString(source)) {
    return require('url-join')(source, src)
  }
  return path.join(source, src)
}

const setMarkDownImageSize = function (markdown, options)  {
  var file = options.file || '';
  var log = options.log || false;
  var ignoreRelative = options.ignoreRelative || false;
  var source = (options.source && options.source.replace(/\/+$/, '')) || '';
  // source += '/';
  var bsname = path.basename(file);
  markdown = markdown.replace(/<img([\s\S]+?)>([^<]*<\/\s*?img>)*/g, function (m, c, other) {
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
      let size;
      if (isUrlString(src)) {
        size = getImageSizeFromUrl_PathSync(src, log);
      } else {
        size = getImgSizeFromPathSync(join(source, src), log);
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

  return markdown.replace(/!\[([\s\S]*?)\]\(([\s\S]*?[^\\])\)/g, function (m, alt, src) {
    if (src) {
      src = src.replace(/\\\)/g, ')');
      if (ignoreRelative && !isUrlString(src)) {
        log && console.log(`[SKIP] ${bsname} (ignore) => ` + m, 'src: ' + src);
        return m;
      }
      let size;
      if (isUrlString(src)) {
        size = getImageSizeFromUrl_PathSync(src, log);
      } else {
        if (ignoreRelative) {
          log && console.log(`[SKIP] ${bsname} (ignore) => ` + m);
          return m;
        }
        size = getImgSizeFromPathSync(join(source, src), log);
      }
      if (!size) {
        log && console.error(`[ERROR] ${bsname} => ${m}`)
      }
      return size ? `<img src="${src}" alt="${alt}" width="${size.width}" height="${size.height}" />` : m;
    }

    log && console.log(`[SKIP] ${bsname} (no src) => ` + m);
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

