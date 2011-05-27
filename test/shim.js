var assert = require('assert');
var browserify = require('browserify');
var vm = require('vm');

exports.shim = function () {
    var src = browserify.bundle({
        base : __dirname + '/shim'
    });
    assert.ok(typeof src === 'string');
    assert.ok(src.length > 0);
    
    var c = { assert : assert };
    vm.runInNewContext(
        'delete Function.prototype.bind;\n'
        + 'delete Array.prototype.filter;\n'
        + src, c
    );
    assert.eql(c.require('./shim')(), [ 5, 7, 9 ]);
};
