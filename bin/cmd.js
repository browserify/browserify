#!/usr/bin/env node
var fs = require('fs');
var JSONStream = require('JSONStream');
var through = require('through');

var b = require('./args')(process.argv.slice(2));

if ((b.argv._[0] === 'help' && b.argv._[1]) === 'advanced'
|| (b.argv.h || b.argv.help) === 'advanced') {
    return fs.createReadStream(__dirname + '/advanced.txt')
        .pipe(process.stdout)
        .on('close', function () { process.exit(1) })
    ;
}
if (b.argv._[0] === 'help' || b.argv.h || b.argv.help
|| process.argv.length <= 2) {
    return fs.createReadStream(__dirname + '/usage.txt')
        .pipe(process.stdout)
        .on('close', function () { process.exit(1) })
    ;
}
if (b.argv.v || b.argv.version) {
    return console.log(require('../package.json').version);
}

b.on('error', function (err) {
    console.error(String(err));
    process.exit(1);
});

if (b.argv.pack) {
    process.stdin.pipe(b.pack()).pipe(process.stdout);
    process.stdin.resume();
    return;
}

if (b.argv.deps) {
    var stringify = JSONStream.stringify();
    b.deps().pipe(stringify).pipe(process.stdout);
    return;
}

var packageFilter = function (info) {
    if (typeof info.browserify === 'string' && !info.browser) {
        info.browser = info.browserify;
        delete info.browserify;
    }
    return info;
};

if (b.argv.list) {
    b.deps({ 
        packageFilter: packageFilter    
    }).pipe(through(function (dep) {
        this.queue(dep.id + '\n');
    })).pipe(process.stdout);
    return;
}

var bundle = b.bundle();
bundle.on('error', function (err) {
    console.error(String(err));
    process.exit(1);
});

var outfile = b.argv.o || b.argv.outfile;
if (outfile) {
    bundle.pipe(fs.createWriteStream(outfile));
}
else {
    bundle.pipe(process.stdout);
}
