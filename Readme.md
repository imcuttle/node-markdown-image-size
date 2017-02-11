# markdown-image-size

**For Bowser's First Render**

parse markdown text => get image elements => image size (image-size, sync-request) => replace markdown image text to html markup.

**Support HTML & Markdown**

## Usage


### Command

```
npm install -g markdown-image-size
```

```
 Usage: mimgs [options] <files...>

 Options:

   -v --version                get current version
   -h --help                   how to use it
   -s --source <path or url>   base path from relative path
   -l --log                    Do print log, Don't print text
   --ignore-relative           ignore relative path, overrides any -s options.
```

```
mimgs -s "dirPath or baseUrl" file/to/markdown.md > file/to/markdown.md
```

### Package

```
npm install -save markdown-image-size
```

```javascript
var markDownImageSize = require('markdown-image-size');
var markDownImageSizeFromPath = markDownImageSize.markDownImageSizeFromPath;

var options = {
    ignoreRelative: false, // default: false
    log: true,             // default: false
    source: ""             // default: ""
}

var newMarkdown = markDownImageSize("markdown text", options);
newMarkdown = markDownImageSizeFromPath("file/to/markdown", options);
```
