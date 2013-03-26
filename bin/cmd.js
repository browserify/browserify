#!/usr/bin/env node
var browserify = require('../');
var fs = require('fs');
var path = require('path');
var JSONStream = require('JSONStream');
var spawn = require('child_process').spawn;
var parseShell = require('shell-quote').parse;
var duplexer = require('duplexer');

var argv = require('optimist')
    .boolean(['deps','pack','ig','dg', 'im', 'd'])
    .alias('insert-globals', 'ig')
    .alias('detect-globals', 'dg')
    .alias('ignore-missing', 'im')
    .alias('debug', 'd')
    .alias('ig', 'fast')
    .default('ig', false)
    .default('im', false)
    .default('dg', true) 
    .default('d', false) 
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

var entries = argv._.concat(argv.e).filter(Boolean).map(function(entry) {
    return path.resolve(process.cwd(), entry);
});
var b = browserify(entries);

b.on('error', function (err) {
    console.error(String(err));
    process.exit(1);
});

[].concat(argv.i).concat(argv.ignore).filter(Boolean)
    .forEach(function (i) { b.ignore(i) })
;

[].concat(argv.r).concat(argv.require).filter(Boolean)
    .forEach(function (r) { b.require(r, { expose: r }) })
;

// resolve any external files and add them to the bundle as externals
[].concat(argv.x).concat(argv.external).filter(Boolean)
    .forEach(function (x) { b.external(path.resolve(process.cwd(), x)) })
;

[].concat(argv.t).concat(argv.transform).filter(Boolean)
    .forEach(function (t) { b.transform(t) })
;

[].concat(argv.c).concat(argv.command).filter(Boolean)
    .forEach(function (c) {
        var cmd = parseShell(c);
        b.transform(function (file) {
            var env = Object.keys(process.env).reduce(function (acc, key) {
                acc[key] = process.env[key];
                return acc;
            }, {});
            env.FILENAME = file;
            var ps = spawn(cmd[0], cmd.slice(1), { env: env });
            var error = '';
            ps.stderr.on('data', function (buf) { error += buf });
            
            ps.on('exit', function (code) {
                if (code === 0) return;
                console.error([
                    'error running source transform command: ' + c,
                    error.split('\n').join('\n  '),
                    ''
                ].join('\n'));
                process.exit(1);
            });
            return duplexer(ps.stdin, ps.stdout);
        });
    })
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
    insertGlobals: argv['insert-globals'] || argv.ig,
    ignoreMissing: argv['ignore-missing'] || argv.im,
    debug:         argv['debug']          || argv.d
});

bundle.on('error', function (err) {
    console.error(String(err));
    process.exit(1);
});

var outfile = argv.o || argv.outfile;
if (outfile) {
    bundle.pipe(fs.createWriteStream(outfile));
}
else {
    bundle.pipe(process.stdout);
}
