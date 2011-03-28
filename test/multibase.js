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
