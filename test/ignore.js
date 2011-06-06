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
