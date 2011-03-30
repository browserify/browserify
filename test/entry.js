var assert = require('assert');
var browserify = require('browserify');
var Script = process.binding('evals').Script;

exports.entry = function () {
    var src = browserify.bundle({
        base : __dirname + '/pkg/a',
        entry : __dirname + '/entry/main.js',
    });
    
    var c = {};
    Script.runInNewContext(src, c);
    
    assert.eql(c.entryResult, 333);
};

exports.entries = function () {
    var src = browserify.bundle({
        base : __dirname + '/pkg/a',
        entry : [
            __dirname + '/entry/one.js',
            __dirname + '/entry/two.js',
        ],
    });
    
    var c = {};
    Script.runInNewContext(src, c);
    
    assert.eql(c.one, 'one');
    assert.eql(c.two, 'two');
    assert.eql(c.onetwo, 'onetwo');
};
