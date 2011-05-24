var assert = require('assert');
var browserify = require('browserify');
var vm = require('vm');

exports.stringBase = function () {
    var src = browserify.bundle(__dirname + '/base/string');
    
    var c = {};
    vm.runInNewContext(src, c);
    
    assert.eql(
        vm.runInNewContext('require("quux")(3)', c),
        13000
    );
};

exports.arrayBase = function () {
    var src = browserify.bundle(__dirname + '/base/array');
    
    var c = {};
    vm.runInNewContext(src, c);
    
    assert.eql(
        vm.runInNewContext('require("quux")(3)', c),
        13000
    );
};
