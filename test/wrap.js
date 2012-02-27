var path = require('path');
var browserify = require('../');
var test = require('tap').test;

function filter (x) {
    var s = __dirname + '/wrap/';
    return x.slice(0, s.length) === s;
}

test('wrap', function (t) {
    t.plan(1);
    var files = browserify({ require : __dirname + '/wrap/a.js' }).files;
    
    t.deepEqual(Object.keys(files).filter(filter).sort(), [
        __dirname + '/wrap/a.js',
        __dirname + '/wrap/node_modules/b/main.js',
        __dirname + '/wrap/node_modules/b/package.json',
        __dirname + '/wrap/c.js',
        __dirname + '/wrap/x.js',
    ].sort());
    t.end();
});

test('wrapArray', function (t) {
    t.plan(1);
    var files = browserify({
        require : [
            __dirname + '/wrap/a.js',
            __dirname + '/wrap/skipme.js',
        ]
    }).files;
    
    t.deepEqual(Object.keys(files).filter(filter).sort(), [
        __dirname + '/wrap/a.js',
        __dirname + '/wrap/node_modules/b/main.js',
        __dirname + '/wrap/node_modules/b/package.json',
        __dirname + '/wrap/c.js',
        __dirname + '/wrap/x.js',
        __dirname + '/wrap/skipme.js',
        __dirname + '/wrap/node_modules/skipmetoo/index.js',
    ].sort());
    t.end();
});
