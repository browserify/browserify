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
    var res = vm.runInNewContext('require("./shim")', c);
    assert.eql(res(), [ 5, 7, 9 ]);
};
