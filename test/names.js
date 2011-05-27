var assert = require('assert');
var browserify = require('browserify');
var vm = require('vm');

exports.named = function () {
    var src = browserify.bundle({
        base : { names : __dirname + '/names' }
    });
    
    var c = {};
    vm.runInNewContext(src, c);
    
    assert.eql(c.require('names').names, {
        __dirname : 'names',
        __filename : 'names/index.js',
    });
};

exports.names = function () {
    var src = browserify.bundle(__dirname + '/names');
    
    var c = {};
    vm.runInNewContext(src, c);
    
    assert.eql(c.require('./index').names, {
        __dirname : '.',
        __filename : './index.js',
    });
};
