#!/usr/bin/env node
var browserify = require('../');
var argv = require('optimist').argv;
var JSONStream = require('JSONStream');
var fs = require('fs');

if (argv.h || argv.help || process.argv.length <= 2) {
    return fs.createReadStream(__dirname + '/usage.txt')
        .pipe(process.stdout)
        .on('close', function () { process.exit(1) })
    ;
}

var entries = argv._.concat(argv.e).filter(Boolean);
var b = browserify(entries);

b.on('error', function (err) {
    console.error(err);
    process.exit(1);
});

[].concat(argv.r).concat(argv.require).filter(Boolean)
    .forEach(function (r) { b.require(r) })
;

if (argv.pack) {
    process.stdin.pipe(b.pack()).pipe(process.stdout);
    process.stdin.resume();
    return;
}

if (argv.deps) {
    var stringify = JSONStream.stringify();
    b.deps().pipe(stringify).pipe(process.stdout);
    return;
}

var outfile = argv.o || argv.outfile;
if (outfile) {
    var ws = fs.createWriteStream(outfile);
    b.bundle().pipe(ws);
}
else {
    b.bundle().pipe(process.stdout);
}
