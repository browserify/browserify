var assert = require('assert');
var browserify = require('browserify');
var Script = process.binding('evals').Script;

exports.dollar = function () {
    var src = browserify.bundle({
        base : __dirname + '/dollar'
    });
    assert.ok(typeof src === 'string');
    assert.ok(src.length > 0);
    
    var c = {};
    Script.runInNewContext(src, c);
    var res = Script.runInNewContext(
        'var $ = require("./dollar");'
        + '$(100)'
        , c
    );
    console.log(res);
};
