var assert = require('assert');
var browserify = require('browserify');
var vm = require('vm');
var EventEmitter = require('events').EventEmitter;

exports.bundleA = function () {
    var src = browserify.bundle(__dirname + '/pkg/a');
    
    var c = {};
    vm.runInNewContext(src, c);
    assert.eql(c.require("./moo").zzz(3), 333);
};

exports.namedA = function () {
    var src = browserify.bundle({
        name : 'wowsy',
        base : __dirname + '/pkg/a',
    });
    
    var c = {};
    vm.runInNewContext(src, c);
    assert.eql(c.require("wowsy/moo").zzz(3), 333);
};

exports.namedMainA = function () {
    var src = browserify.bundle({
        name : 'wowsy',
        main : './moo.js',
        base : __dirname + '/pkg/a',
    });
    
    var c = {};
    vm.runInNewContext(src, c);
    
    assert.eql(c.require("wowsy").zzz(3), 333);
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
    
    assert.eql(c.require("wowsy").zzz(3), 333);
    assert.ok(c.require.modules['wowsy/moo']);
};

exports.namedMainNonBaseA = function () {
    var src = browserify.bundle({
        name : 'wowsy',
        main : __dirname + '/pkg/a/moo.js',
    });
    
    var c = {};
    vm.runInNewContext(src, c);
    
    assert.eql(c.require("wowsy").zzz(3), 333);
    assert.ok(
        c.require.modules['wowsy/moo']
        || c.require.modules['wowsy/moo.js']
    );
};

exports.bundleB = function () {
    var src = browserify.bundle(__dirname + '/pkg/b');
    
    var c = {};
    vm.runInNewContext(src, c);
    assert.eql(c.require("$$$").zzz(3), 333);
};

exports.namedB = function () {
    var src = browserify.bundle({
        name : 'wowsy',
        base : __dirname + '/pkg/b',
    });
    
    var c = {};
    vm.runInNewContext(src, c);
    
    assert.eql(c.require("wowsy").zzz(3), 333);
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
    
    assert.eql(c.require("wowsy").zzz(3), 333);
    assert.ok(c.require.modules['wowsy/moo']);
};

exports.bundleC = function () {
    var src = browserify.bundle(__dirname + '/pkg/c');
    
    var c = {};
    vm.runInNewContext(src, c);
    
    assert.eql(c.require("doom").fn(3), 300);
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
    
    assert.eql(c.require("wowsy/bar")(), 333);
    assert.eql(c.require("wowsy")(), 444);
    assert.eql(c.require("wowsy/foo")(), 444);
};

exports.innerRequireModules = function () {
    var src = browserify.bundle({
        base : __dirname + '/pkg/e',
    });
    
    var c = { assert : assert };
    vm.runInNewContext(src, c);
    
    assert.eql(c.require('./inner')(assert), 555);
};

exports.invalidJSON = function () {
    var src = browserify.bundle({
        base : { f : __dirname + '/pkg/f' },
    });
    
    var c = {};
    vm.runInNewContext(src, c);
    
    assert.eql(c.require('f')(), 555);
};

exports.trapInvalidJSON = function () {
    var ee = new EventEmitter;
    var to = setTimeout(function () {
        assert.fail('never caught syntax error from faulty json');
    }, 5000);
    
    ee.on('syntaxError', function () {
        clearTimeout(to);
    });
    
    var src = browserify.bundle({
        base : { f : __dirname + '/pkg/f' },
        listen : ee,
    });
    
    var c = {};
    vm.runInNewContext(src, c);
    
    assert.eql(c.require('f')(), 555);
};
