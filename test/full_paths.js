var unpack = require('browser-unpack');
var browserify = require('../');
var test = require('tap').test;

var deps = [
    __dirname + '/entry/main.js',
    __dirname + '/entry/one.js',
    __dirname + '/entry/two.js'
];

test('fullPaths enabled', function (t) {
    t.plan(3);

    var b = browserify({
        entries: [ deps[0] ],
        fullPaths: true
    });

    b.bundle(function (err, src) {
        unpack(src).forEach(function(dep) {
            t.notEqual(deps.indexOf(dep.id), -1, 'full path name for dep.id');
        });
    });
});

test('fullPaths disabled', function (t) {
    t.plan(3);

    var b = browserify({
        entries: [ deps[0] ],
        fullPaths: false
    });

    b.bundle(function (err, src) {
        unpack(src).forEach(function(dep) {
            t.equal(deps.indexOf(dep.id), -1, 'full path name no longer available');
        });
    });
});
