var assert = require('assert');
var browserify = require('browserify');
var vm = require('vm');

exports.stringBase = function () {
    var src = browserify.bundle(__dirname + '/base/string');
    
    var c = { console : console };
    vm.runInNewContext(src, c);
    assert.equal(c.require('./')(3), 13000);
};

exports.arrayBase = function () {
    var src = browserify.bundle(__dirname + '/base/array');
    
    var c = {};
    vm.runInNewContext(src, c);
    
    assert.equal(c.require('./')(3), 13000);
};

/* if somebody ever figures out how to make these work, uncomment:
exports.objectBase = function () {
    assert.throws(function () {
        browserify.bundle(__dirname + '/base/object');
    });
    
    var c = { assert : assert };
    vm.runInNewContext(src, c);
    
    assert.equal(c.require('./aa/a')(3), 13000);
};
*/
