var path = require('path');
var browserify = require('../');
var test = require('tap').test;

test('wrap', function (t) {
    t.plan(1);
    var files = browserify({ require : __dirname + '/wrap/a.js' }).files;
    
    t.deepEqual(Object.keys(files).sort(), [
        path.normalize(__dirname + '/../builtins/path.js'),
        path.normalize(__dirname + '/../builtins/vm.js'),
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
    
    t.deepEqual(Object.keys(files).sort(), [
        path.normalize(__dirname + '/../builtins/path.js'),
        path.normalize(__dirname + '/../builtins/vm.js'),
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
