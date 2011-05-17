var assert = require('assert');
var browserify = require('browserify');
var vm = require('vm');

exports.bundleA = function () {
    var src = browserify.bundle(__dirname + '/pkg/a');
    
    var c = {};
    vm.runInNewContext(src, c);
    
    assert.eql(
        vm.runInNewContext('require("./moo").zzz(3)', c),
        333
    );
};

exports.namedA = function () {
    var src = browserify.bundle({
        name : 'wowsy',
        base : __dirname + '/pkg/a',
    });
    
    var c = {};
    vm.runInNewContext(src, c);
    
    assert.eql(
        vm.runInNewContext('require("wowsy/moo").zzz(3)', c),
        333
    );
};

exports.namedMainA = function () {
    var src = browserify.bundle({
        name : 'wowsy',
        main : './moo.js',
        base : __dirname + '/pkg/a',
    });
    
    var c = {};
    vm.runInNewContext(src, c);
    
    assert.eql(
        vm.runInNewContext('require("wowsy").zzz(3)', c),
        333
    );
    
    assert.ok(c.require.modules['wowsy/moo']);
};

exports.namedMainAbsA = function () {
    var src = browserify.bundle({
        name : 'wowsy',
        main : __dirname + '/pkg/a/moo.js',
        base : __dirname + '/pkg/a',
    });
    
    var c = {};
    vm.runInNewContext(src, c);
    
    assert.eql(
        vm.runInNewContext('require("wowsy").zzz(3)', c),
        333
    );
    
    assert.ok(c.require.modules['wowsy/moo']);
};

exports.namedMainNonBaseA = function () {
    var src = browserify.bundle({
        name : 'wowsy',
        main : __dirname + '/pkg/a/moo.js',
    });
    
    var c = {};
    vm.runInNewContext(src, c);
    
    assert.eql(
        vm.runInNewContext('require("wowsy").zzz(3)', c),
        333
    );
    
    assert.ok(
        c.require.modules['wowsy/moo']
        || c.require.modules['wowsy/moo.js']
    );
};

exports.bundleB = function () {
    var src = browserify.bundle(__dirname + '/pkg/b');
    
    var c = {};
    vm.runInNewContext(src, c);
    
    assert.eql(
        vm.runInNewContext('require("$$$").zzz(3)', c),
        333
    );
};

exports.namedB = function () {
    var src = browserify.bundle({
        name : 'wowsy',
        base : __dirname + '/pkg/b',
    });
    
    var c = {};
    vm.runInNewContext(src, c);
    
    assert.eql(
        vm.runInNewContext('require("wowsy").zzz(3)', c),
        333
    );
    
    assert.ok(!c.require.modules["$$$"]);
};

exports.namedMainB = function () {
    var src = browserify.bundle({
        name : 'wowsy',
        main : './moo.js',
        base : __dirname + '/pkg/a',
    });
    
    var c = {};
    vm.runInNewContext(src, c);
    
    assert.eql(
        vm.runInNewContext('require("wowsy").zzz(3)', c),
        333
    );
    
    assert.ok(c.require.modules['wowsy/moo']);
};

exports.bundleC = function () {
    var src = browserify.bundle(__dirname + '/pkg/c');
    
    var c = {};
    vm.runInNewContext(src, c);
    
    assert.eql(
        vm.runInNewContext('require("doom").fn(3)', c),
        300
    );
    
    assert.eql(
        Object.keys(c.require.modules)
            .filter(function (name) { return name.match(/doom/) })
        , [ 'doom', 'doom/doom-browser' ]
    );
    
    assert.ok(!c.require.modules['seq']);
};

exports.namedMainRelativeD = function () {
    var src = browserify.bundle({
        name : 'wowsy',
        main : __dirname + '/pkg/d/foo.js',
        base : __dirname + '/pkg/d',
    });
    
    var c = {};
    vm.runInNewContext(src, c);
    
    assert.eql(
        vm.runInNewContext('require("wowsy/bar")()', c),
        333
    );
    
    assert.eql(
        vm.runInNewContext('require("wowsy")()', c),
        444
    );
    
    assert.eql(
        vm.runInNewContext('require("wowsy/foo")()', c),
        444
    );
};
