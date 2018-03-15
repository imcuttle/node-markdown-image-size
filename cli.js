#!/usr/bin/env node

var argv = require('minimist')(process.argv.slice(2));

var options = {
    files: argv._ || [],
    help: !!argv.h || !!argv.help,
    version: !!argv.v || !!argv.version,
    source: argv.s || argv.source || '',
    quiet: !!argv.q || !!argv.quiet,
    log: !!argv.l || !!argv.log,
    ignoreRelative: !!argv['ignore-relative'],
    overwrite: !!argv['o'] || !!argv['overwrite']
}

if (options.help) {
    console.log(" Usage: mimgs [options] <files...>");
    console.log('');
    console.log(' Options:');
    console.log('');
    console.log('   -v --version                get current version');
    console.log('   -h --help                   how to use it');
    console.log('   -s --source <path or url>   base path from relative path');
    console.log('   -o --overwrite              overwrite files');
    console.log('   -q --quiet                  Don\'t print any');
    console.log('   -l --log                    Do print log, Don\'t print text');
    console.log('   --ignore-relative           ignore relative path, overrides any -s options.');
    console.log('');
    return;
}

if (options.version) {
    console.log(require('./package.json').version);
    return;
}

try {
    
if (options.files.length === 0) {
    throw new Error("[ERROR] files is empty.")
}

options.files.forEach(file => {
    var markDownImageSize = require('./');
    var markDownImageSizeFromPath = markDownImageSize.markDownImageSizeFromPath;
    if (options.quiet) {
        options.log = false;
    }
    var str = markDownImageSizeFromPath(file, options);
    !options.quiet && !options.log && process.stdout.write(str);

    if (options.overwrite) {
        require('fs').writeFileSync(file, str);
    }
})

} catch (ex) {
    !options.quiet && console.error(ex.message);
    process.exit(1);
}





