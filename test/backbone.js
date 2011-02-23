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
    
    var c = {};
    Script.runInNewContext(src, c);
    var b = Script.runInNewContext('require("backbone")', c);
    assert.eql(
        Object.keys(backbone),
        Object.keys(b)
    );
};
