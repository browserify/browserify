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

exports.objectRequire = function () {
    var src = browserify.bundle({
        require : { 'doom' : 'hashish' },
    });
    
    var c = {};
    vm.runInNewContext(src, c);
    verifyHashish(c.require('doom'))
    assert.ok(c.require.modules.doom);
    assert.ok(!c.require.modules.hashish);
};

exports.jqueryRequire = function () {
    var src = browserify.bundle({
        require : { 'jquery' : 'jquery-browserify' },
    });
    
    var c = {};
    vm.runInNewContext(src, c);
    assert.ok(c.require.modules.jquery);
    assert.ok(!c.require.modules['jquery-browserify']);
};

exports.mixedRequire = function () {
    var src = browserify.bundle({
        require : [
            'hashish',
            { 'jquery' : 'jquery-browserify' },
        ]
    });
    
    var c = {};
    vm.runInNewContext(src, c);
    verifyHashish(c.require('hashish'));
    assert.ok(c.require.modules.jquery);
    assert.ok(!c.require.modules['jquery-browserify']);
};

exports.multiMixedRequire = function () {
    var src = browserify.bundle({
        require : [
            'traverse',
            'seq',
            {
                'jquery' : 'jquery-browserify',
                'h' : 'hashish',
            },
            { par : 'seq' },
        ],
    });
    
    var c = {};
    vm.runInNewContext(src, c);
    verifyHashish(c.require('h'));
    assert.ok(c.require.modules.seq);
    assert.ok(c.require.modules.par);
    assert.equal(c.require('seq'), c.require('par'));
    assert.ok(c.require.modules.traverse);
    assert.ok(c.require.modules.jquery);
    assert.ok(!c.require.modules['jquery-browserify']);
};
