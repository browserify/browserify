#!/usr/bin/env node
var browserify = require('../');
var fs = require('fs');
var JSONStream = require('JSONStream');

var argv = require('optimist')
    .boolean(['deps','pack','ig','dg'])
    .alias('insert-globals', 'ig')
    .alias('detect-globals', 'dg')
    .alias('ig', 'fast')
    .default('ig', false)
    .default('dg', true)
    .argv
;

if (argv.h || argv.help || process.argv.length <= 2) {
    return fs.createReadStream(__dirname + '/usage.txt')
        .pipe(process.stdout)
        .on('close', function () { process.exit(1) })
    ;
}
if (argv.v || argv.verbose) {
    return console.log(require('../package.json').version);
}

var entries = argv._.concat(argv.e).filter(Boolean);
var b = browserify(entries);

b.on('error', function (err) {
    console.error(err);
    process.exit(1);
});

[].concat(argv.i).concat(argv.ignore).filter(Boolean)
    .forEach(function (i) { b.ignore(i) })
;
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

var bundle = b.bundle({
    detectGlobals: argv['detect-globals'] !== false && argv.dg !== false,
    insertGlobals: argv['insert-globals'] || argv.ig
});

var outfile = argv.o || argv.outfile;
if (outfile) {
    bundle.pipe(fs.createWriteStream(outfile));
}
else {
    bundle.pipe(process.stdout);
}
