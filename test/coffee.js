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

exports.coffeeEntry = function () {
    var b = browserify({ entry : __dirname + '/coffee/entry.coffee' });
    var src = b.bundle();
    
    var to = setTimeout(function () {
        assert.fail('never called done');
    }, 5000);
    
    var c = {
        setTimeout : setTimeout,
        done : function (fn) {
            clearTimeout(to);
            assert.equal(fn(10), 100);
        }
    };
    vm.runInNewContext(src, c);
};
