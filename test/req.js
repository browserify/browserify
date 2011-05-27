var assert = require('assert');
var browserify = require('browserify');
var vm = require('vm');

function verifyHashish (h) {
    assert.deepEqual(
        h.map({ a : 1, b : 2 }, function (x) { return x * 10 }),
        { a : 10, b : 20 }
    );
}

exports.stringRequire = function () {
    var src = browserify.bundle({
        require : 'hashish',
    });
    
    var c = {};
    vm.runInNewContext(src, c);
    verifyHashish(c.require('hashish'))
    assert.ok(c.require.modules.hashish);
};

exports.arrayRequire = function () {
    var src = browserify.bundle({
        require : [ 'hashish' ],
    });
    
    var c = {};
    vm.runInNewContext(src, c);
    verifyHashish(c.require('hashish'))
    assert.ok(c.require.modules.hashish);
};
