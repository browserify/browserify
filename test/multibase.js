var assert = require('assert');
var browserify = require('browserify');
var vm = require('vm');

exports.multibaseObject = function () {
    var src = browserify.bundle({
        base : {
            foo : __dirname + '/pkg/a',
            bar : __dirname + '/pkg/b',
        },
    });
    
    var c = {};
    vm.runInNewContext(src, c);
    
    assert.eql(c.require('foo/moo').zzz(3), 333);
    assert.eql(c.require("bar").zzz(3), 333);
};

exports.multibaseArray = function () {
    var src = browserify.bundle({
        base : [
            __dirname + '/pkg/a',
            __dirname + '/pkg/c',
        ],
    });
    
    var c = {};
    vm.runInNewContext(src, c);
    
    assert.eql(c.require("./moo").zzz(3), 333);
    assert.eql(c.require("doom").fn(3), 300);
};
