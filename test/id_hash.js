var browserify = require('../');
var crypto = require('crypto');
var test = require('tap').test;
var path = require('path');
var opts = { basedir: path.dirname(__dirname) };

function hash(what) {
    return crypto.createHash('md5').update(what).digest('base64').slice(0, 6);
}
var r = __dirname + '/id_hash/require.js';
var h = hash(path.resolve(opts.basedir, r));

test('idHash required deps', function (t) {
    t.plan(1);
    var expect = new RegExp("'" + h + "'");
    var b = browserify(opts);
    b.require(r, { expose: 'idhashdep' });
    b.bundle(function (err, src) {
        t.ok(expect.test(src), 'Output contains valid hash');
    });
});

test('idHash external deps', function (t) {
    t.plan(1);
    var expect = new RegExp(h);
    var b = browserify(__dirname + '/id_hash/main.js', opts);
    b.external(r);
    b.bundle(function (err, src) {
        t.ok(expect.test(src), 'Output contains valid hash');
    });
});

test('idHash exposeAll', function (t) {
    t.plan(1);
    var expect = new RegExp(h);
    var b = browserify(__dirname + '/id_hash/require.js', {
        exposeAll: true,
        basedir: opts.basedir
    });
    b.bundle(function (err, src) {
        t.ok(expect.test(src), 'Output contains valid hash');
    });
});
