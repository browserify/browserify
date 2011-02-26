var assert = require('assert');
var browserify = require('browserify');
var Script = process.binding('evals').Script;

exports.bundleA = function () {
    var src = browserify.bundle(__dirname + '/pkg/a');
    
    var c = {};
    Script.runInNewContext(src, c);
    
    assert.eql(
        Script.runInNewContext('require("./moo").zzz(3)', c),
        333
    );
};

exports.namedA = function () {
    var src = browserify.bundle({
        name : 'wowsy',
        base : __dirname + '/pkg/a',
    });
    
    var c = {};
    Script.runInNewContext(src, c);
    
    assert.eql(
        Script.runInNewContext('require("wowsy/moo").zzz(3)', c),
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
    Script.runInNewContext(src, c);
    
    assert.eql(
        Script.runInNewContext('require("wowsy").zzz(3)', c),
        333
    );
};
