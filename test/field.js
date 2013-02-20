var assert = require('assert');
var browserify = require('../');
var vm = require('vm');
var test = require('tap').test;

test('fieldString', function (t) {
    t.plan(1);
    
    var dir = __dirname + '/field';
    var b = browserify();
    b.expose('./string.js', dir + '/string.js');
    b.bundle(function (err, src) {
        var c = {};
        vm.runInNewContext(src, c);
        t.equal(
            c.require('./string.js'),
            'browser'
        );
    });
});

test('fieldObject', function (t) {
    t.plan(1);
    
    var dir = __dirname + '/field/';
    var b = browserify();
    b.expose('./object.js', dir + '/object.js');
    b.bundle(function (err, src) {
        var c = {};
        vm.runInNewContext(src, c);
        t.equal(
            c.require('./object.js'),
            'browser'
        );
    });
});

test('missObject', function (t) {
    t.plan(1);
    
    var dir = __dirname + '/field/';
    var b = browserify();
    b.expose('./miss.js', dir + '/miss.js');
    b.bundle(function (err, src) {
        var c = {};
        vm.runInNewContext(src, c);
        t.equal(
            c.require('./miss.js'),
            '!browser'
        );
    });
});

test('fieldSub', function (t) {
    t.plan(1);
    
    var dir = __dirname + '/field/';
    var b = browserify();
    b.expose('./sub.js', dir + '/sub.js');
    b.bundle(function (err, src) {
        var c = {};
        vm.runInNewContext(src, c);
        t.equal(
            c.require('./sub.js'),
            'browser'
        );
    });
});
