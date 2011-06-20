var assert = require('assert');
var browserify = require('../');
var vm = require('vm');

exports.dollar = function () {
    var src = browserify.bundle(__dirname + '/dollar/dollar/index.js');
    
    assert.ok(typeof src === 'string');
    assert.ok(src.length > 0);
    
    var c = {};
    vm.runInNewContext(src, c);
    var res = vm.runInNewContext('require("./")(100)', c);
    assert.eql(res, 10000);
};
