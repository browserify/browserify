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
    assert.ok(c.require.modules['hashish/package.json']);
};

exports.arrayRequire = function () {
    var src = browserify.bundle({
        require : [ 'hashish' ],
    });
    
    var c = {};
    vm.runInNewContext(src, c);
    verifyHashish(c.require('hashish'))
    assert.ok(c.require.modules['hashish/package.json']);
};

exports.objectRequire = function () {
    var src = browserify.bundle({
        require : { 'doom' : 'hashish' },
    });
    
    var c = {};
    vm.runInNewContext(src, c);
    verifyHashish(c.require('doom'))
    assert.ok(c.require.modules['doom/package.json']);
    assert.ok(!c.require.modules['hashish/package.json']);
};

exports.jqueryRequire = function () {
    var src = browserify.bundle({
        require : { 'jquery' : 'jquery-browserify' },
    });
    
    var c = {};
    vm.runInNewContext(src, c);
    assert.ok(c.require.modules['jquery/package.json']);
    assert.ok(!c.require.modules['jquery-browserify/package.json']);
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
    assert.ok(c.require.modules['jquery/package.json']);
    assert.ok(!c.require.modules['jquery-browserify/package.json']);
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
    assert.ok(c.require.modules['seq/package.json']);
    assert.ok(c.require.modules['par/package.json']);
    //assert.equal(c.require('seq'), c.require('par'));
    //TODO: check for duplicate modules and only include once
    assert.ok(c.require.modules['traverse/package.json']);
    assert.ok(c.require.modules['jquery/package.json']);
    assert.ok(!c.require.modules['jquery-browserify/package.json']);
};
