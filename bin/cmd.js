#!/usr/bin/env node
var browserify = require('../');
var fs = require('fs');
var path = require('path');
var JSONStream = require('JSONStream');
var spawn = require('child_process').spawn;
var parseShell = require('shell-quote').parse;
var duplexer = require('duplexer');
var through = require('through');

var argv = require('optimist')
    .boolean(['deps','pack','ig','dg', 'im', 'd','list'])
    .string(['s'])
    .alias('insert-globals', 'ig')
    .alias('detect-globals', 'dg')
    .alias('ignore-missing', 'im')
    .alias('debug', 'd')
    .alias('standalone', 's')
    .alias('ig', 'fast')
    .default('ig', false)
    .default('im', false)
    .default('dg', true) 
    .default('d', false) 
    .argv
;

if ((argv._[0] === 'help' && argv._[1]) === 'advanced'
|| (argv.h || argv.help) === 'advanced') {
    return fs.createReadStream(__dirname + '/advanced.txt')
        .pipe(process.stdout)
        .on('close', function () { process.exit(1) })
    ;
}
if (argv._[0] === 'help' || argv.h || argv.help || process.argv.length <= 2) {
    return fs.createReadStream(__dirname + '/usage.txt')
        .pipe(process.stdout)
        .on('close', function () { process.exit(1) })
    ;
}
if (argv.v || argv.version) {
    return console.log(require('../package.json').version);
}

var entries = argv._.concat(argv.e).concat(argv.entry)
.filter(Boolean).map(function(entry) {
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
    .forEach(function (r) {
        var xs = r.split(':');
        b.require(xs[0], { expose: xs.length === 1 ? xs[0] : xs[1] })
    })
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

if (argv.list) {
    b.deps().pipe(through(function (dep) {
        this.queue(dep.id + '\n');
    })).pipe(process.stdout);
    return;
}

if (argv.standalone === true) {
    console.error('--standalone requires an export name argument');
    process.exit(1);
}

var bundle = b.bundle({
    detectGlobals: argv['detect-globals'] !== false && argv.dg !== false,
    insertGlobals: argv['insert-globals'] || argv.ig,
    ignoreMissing: argv['ignore-missing'] || argv.im,
    debug: argv['debug'] || argv.d,
    standalone: argv['standalone'] || argv.s
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
