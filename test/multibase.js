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
    
    assert.eql(
        vm.runInNewContext('require("foo/moo").zzz(3)', c),
        333
    );
    
    assert.eql(
        vm.runInNewContext('require("bar").zzz(3)', c),
        333
    );
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
    
    assert.eql(
        vm.runInNewContext('require("./moo").zzz(3)', c),
        333
    );
    
    assert.eql(
        vm.runInNewContext('require("doom").fn(3)', c),
        300
    );

};
