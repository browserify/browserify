var assert = require('assert');
var vm = require('vm');
var fs = require('fs');
var browserify = require('../');

exports.coffee = function () {
    var src = browserify.bundle(__dirname + '/coffee/index.coffee');
    var c = {};
    vm.runInNewContext(src, c);
    
    assert.equal(c.require('./foo.coffee')(5), 50);
    assert.equal(c.require('./foo')(5), 50);
    
    assert.equal(c.require('./bar.js'), 500);
    assert.equal(c.require('./bar'), 500);
    
    assert.equal(c.require('./baz.coffee'), 1000);
    assert.equal(c.require('./baz'), 1000);
    
    assert.equal(c.require('./'), 10 * 10 * 500 + 1000);
    assert.equal(c.require('./index.coffee'), 10 * 10 * 500 + 1000);
};
