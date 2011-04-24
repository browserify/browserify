var assert = require('assert');
var browserify = require('browserify');
var vm = require('vm');

exports.dollar = function () {
    var src = browserify.bundle({
        base : __dirname + '/dollar'
    });
    assert.ok(typeof src === 'string');
    assert.ok(src.length > 0);
    
    var c = {};
    vm.runInNewContext(src, c);
    var res = vm.runInNewContext(
        'var $ = require("./dollar");'
        + '$(100)'
        , c
    );
    assert.eql(res, 10000);
};
