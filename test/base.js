var assert = require('assert');
var browserify = require('browserify');
var vm = require('vm');

exports.stringBase = function () {
    var src = browserify.bundle(__dirname + '/base/string');
    
    var c = {};
    vm.runInNewContext(src, c);
    assert.equal(c.require('quux')(3), 13000);
};

exports.arrayBase = function () {
    var src = browserify.bundle(__dirname + '/base/array');
    
    var c = {};
    vm.runInNewContext(src, c);
    
    assert.equal(c.require('quux')(3), 13000);
};

exports.objectBase = function () {
    var src = browserify.bundle(__dirname + '/base/object');
    
    var c = { assert : assert };
    vm.runInNewContext(src, c);
    
    assert.equal(c.require('quux/aa/a')(3), 13000);
};
