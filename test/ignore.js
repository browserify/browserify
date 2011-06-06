var assert = require('assert');
var vm = require('vm');
var fs = require('fs');
var browserify = require('browserify');

exports.explicitIgnore = function () {
    var src = browserify.bundle(__dirname + '/ignore/explicit');
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
};
