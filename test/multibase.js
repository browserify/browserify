var assert = require('assert');
var browserify = require('browserify');
var Script = process.binding('evals').Script;

exports.multibaseObject = function () {
    var src = browserify.bundle({
        base : {
            foo : __dirname + '/pkg/a',
            bar : __dirname + '/pkg/b',
        },
    });
    
    var c = {};
    Script.runInNewContext(src, c);
    
    assert.eql(
        Script.runInNewContext('require("foo/moo").zzz(3)', c),
        333
    );
    
    assert.eql(
        Script.runInNewContext('require("bar").zzz(3)', c),
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
    Script.runInNewContext(src, c);
    
    assert.eql(
        Script.runInNewContext('require("./moo").zzz(3)', c),
        333
    );
    
    assert.eql(
        Script.runInNewContext('require("doom").fn(3)', c),
        300
    );

};
