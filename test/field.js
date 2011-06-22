var assert = require('assert');
var browserify = require('browserify');
var vm = require('vm');

exports.fieldString = function () {
    var dir = __dirname + '/field/';
    var src = browserify(dir + '/string.js').bundle();
    
    var c = {};
    vm.runInNewContext(src, c);
    assert.equal(
        c.require('./string.js'),
        'browser'
    );
};

exports.fieldObject = function () {
    var dir = __dirname + '/field/';
    var src = browserify(dir + '/object.js').bundle();
    
    var c = {};
    vm.runInNewContext(src, c);
    assert.equal(
        c.require('./object.js'),
        'browser'
    );
};

exports.missObject = function () {
    var dir = __dirname + '/field/';
    var src = browserify(dir + '/miss.js').bundle();
    
    var c = {};
    vm.runInNewContext(src, c);
    assert.equal(
        c.require('./miss.js'),
        '!browser'
    );
};

exports.fieldSub = function () {
    var dir = __dirname + '/field/';
    var src = browserify(dir + '/sub.js').bundle();
    
    var c = {};
    vm.runInNewContext(src, c);
    assert.equal(
        c.require('./sub.js'),
        'browser'
    );
};
