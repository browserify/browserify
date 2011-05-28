var assert = require('assert');
var browserify = require('browserify');
var vm = require('vm');
var Hash = require('hashish');

exports.modules = function () {
    var src = browserify.bundle({
        base : {
            'foomoduletest' : __dirname + '/modules/foomoduletest'
        },
    });
    
    assert.ok(typeof src === 'string');
    assert.ok(src.length > 0);
    
    var c = {};
    vm.runInNewContext(src, c);
    assert.eql(c.require('foomoduletest').bar, 55)
};

exports.precedence = function () {
    var src = browserify.bundle({
        base : __dirname + '/modules/precedence',
        require : [ 'hashish' ],
    });
    
    var c = {};
    vm.runInNewContext(src, c);
    assert.ok(c.require.modules.hashish);
    assert.deepEqual(
        c.require('hashish').map(
            { a : 1, b :2 }, function (x) { return x * 100 }
        ),
        { a : 100, b : 200 }
    );
    assert.ok(c.require.modules['./node_modules/hashish/index']);
    assert.notEqual(c.require('hashish'), c.require('./node_modules/hashish'));
    assert.equal(c.require('./x'), 'meow');
};
