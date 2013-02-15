#!/usr/bin/env node
var browserify = require('./v2');
var argv = require('optimist').argv;
var JSONStream = require('JSONStream');

var entries = argv._.concat(argv.e).filter(Boolean);
var b = browserify(entries);

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

b.bundle().pipe(process.stdout);
