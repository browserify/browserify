var assert = require('assert');
var vm = require('vm');
var fs = require('fs');
var browserify = require('browserify');

exports.ignore = function () {
    [ 'explicit', 'implicit', 'implicit_plural' ].forEach(function (dir) {
        var src = browserify.bundle(__dirname + '/ignore/' + dir);
        var c = {};
        vm.runInNewContext(src, c);
        
        var files = Object.keys(c.require.modules)
            .filter(function (file) { return file.match(/^\./) })
        ;
        assert.deepEqual(files.sort(), [
            './package.json',
            './x/x.js',
            './y.js',
        ]);
    });
};

exports.ignoreDevDeps = function () {
    var src = browserify.bundle(__dirname + '/ignore/dev');
    var c = {};
    vm.runInNewContext(src, c);
    
    var files = Object.keys(c.require.modules)
        .filter(function (file) { return file.match(/^\./) })
    ;
    assert.deepEqual(files.sort(), [
        './node_modules/bar/index.js',
        './package.json',
        './x.js'
    ]);
};

exports.ignoreNonDeps = function () {
    var src = browserify.bundle(__dirname + '/ignore/nondep');
    var c = {};
    vm.runInNewContext(src, c);
    
    var files = Object.keys(c.require.modules)
        .filter(function (file) { return file.match(/^\./) })
    ;
    assert.deepEqual(files.sort(), [
        './node_modules/bar/index.js',
        './node_modules/quux/index.js',
        './package.json',
        './x.js'
    ]);
};

exports.ignoreBrowserifyString = function () {
    var src = browserify.bundle(__dirname + '/ignore/browserify_string');
    var c = {};
    vm.runInNewContext(src, c);
    assert.equal(
        c.require('./package.json').main,
        './browser.js'
    );
    assert.deepEqual(
        Object.keys(c.require.modules).filter(function (x) {
            return x.match(/^\./)
        }),
        './browser.js'
    );
};
