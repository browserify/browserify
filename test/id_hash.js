var browserify = require('../');
var test = require('tap').test;
var path = require('path');
var opts = { basedir: path.dirname(__dirname) };

test('idHash required deps', function (t) {
    t.plan(1);
    var b = browserify(opts);
    b.require(__dirname + '/id_hash/require.js', { expose: 'idhashdep' });
    b.bundle(function (err, src) {
        t.ok(/\'GfayEO\'/.test(src), 'Output contains valid hash');
    });
});

test('idHash external deps', function (t) {
    t.plan(1);
    var b = browserify(__dirname + '/id_hash/main.js', opts);
    b.external(__dirname + '/id_hash/require.js');
    b.bundle(function (err, src) {
        t.ok(/GfayEO/.test(src), 'Output contains valid hash');
    });
});

test('idHash exposeAll', function (t) {
    t.plan(1);
    var b = browserify(__dirname + '/id_hash/require.js', {
        exposeAll: true,
        basedir: opts.basedir
    });
    b.bundle(function (err, src) {
        t.ok(/GfayEO/.test(src), 'Output contains valid hash');
    });
});
