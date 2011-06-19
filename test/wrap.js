var assert = require('assert');
var path = require('path');
var wrapper = require('../lib/wrap');

exports.wrap = function () {
    var to = setTimeout(function () {
        assert.fail('never walked');
    }, 10000);
    
    wrapper.walk(__dirname + '/wrap/a.js', function (err, files) {
        clearTimeout(to);
        if (err) assert.fail(err);
        
        assert.deepEqual(Object.keys(files).sort(), [
            __dirname + '/wrap/a.js',
            __dirname + '/wrap/node_modules/b/main.js',
            __dirname + '/wrap/c.js',
            __dirname + '/wrap/x.js',
            path.resolve(__dirname, '../builtins/vm.js'),
        ].sort());
    });
};

exports.wrapArray = function () {
    var to = setTimeout(function () {
        assert.fail('never walked');
    }, 10000);
    
    wrapper.walk([ __dirname + '/wrap/a.js', __dirname + '/wrap/skipme.js' ],
    function (err, files) {
        clearTimeout(to);
        if (err) assert.fail(err);
        
        assert.deepEqual(Object.keys(files).sort(), [
            __dirname + '/wrap/a.js',
            __dirname + '/wrap/node_modules/b/main.js',
            __dirname + '/wrap/c.js',
            __dirname + '/wrap/x.js',
            __dirname + '/wrap/skipme.js',
            __dirname + '/wrap/node_modules/skipmetoo/index.js',
            path.resolve(__dirname, '../builtins/vm.js'),
        ].sort());
    });
};
