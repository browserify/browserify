var assert = require('assert');
var path = require('path');
var browserify = require('../');

exports.wrap = function () {
    var files = browserify(__dirname + '/wrap/a.js').files;
    
    assert.deepEqual(Object.keys(files).sort(), [
        'path', 'vm',
        __dirname + '/wrap/a.js',
        __dirname + '/wrap/node_modules/b/main.js',
        __dirname + '/wrap/node_modules/b/package.json',
        __dirname + '/wrap/c.js',
        __dirname + '/wrap/x.js',
    ].sort());
};

exports.wrapArray = function () {
    var files = browserify([
        __dirname + '/wrap/a.js',
        __dirname + '/wrap/skipme.js',
    ]).files;
    
    assert.deepEqual(Object.keys(files).sort(), [
        'path', 'vm',
        __dirname + '/wrap/a.js',
        __dirname + '/wrap/node_modules/b/main.js',
        __dirname + '/wrap/node_modules/b/package.json',
        __dirname + '/wrap/c.js',
        __dirname + '/wrap/x.js',
        __dirname + '/wrap/skipme.js',
        __dirname + '/wrap/node_modules/skipmetoo/index.js',
    ].sort());
};
