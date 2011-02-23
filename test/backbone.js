var assert = require('assert');
var browserify = require('browserify');
var Script = process.binding('evals').Script;
var backbone = require('backbone');

exports.backbone = function () {
    var src = browserify.bundle({
        require : 'backbone'
    });
    assert.ok(typeof src === 'string');
    assert.ok(src.length > 0);
console.log(src);
    
    var c = {};
    Script.runInNewContext(src, c);
    console.dir(c);
    /*
    var res = Script.runInNewContext(
        'var $ = require("./dollar");'
        + '$(100)'
        , c
    );
    assert.eql(res, 10000);
    */
};
