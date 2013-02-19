var browserify = require('../');
var test = require('tap').test;
var vm = require('vm');

test('utf8 buffer to base64', function (t) {
    t.plan(1);
    var b = browserify();
    b.require('buffer');
    b.bundle(function (err, src) {
        if (err) t.fail(err);
        var c = {};
        vm.runInNewContext(src, c);
        t.equal(
            new c.require('buffer').Buffer("Ձאab", "utf8").toString("base64"),
            new Buffer("Ձאab", "utf8").toString("base64")
        );
    });
});

test('utf8 buffer to hex', function (t) {
    t.plan(1);
    var b = browserify();
    b.require('buffer');
    b.bundle(function (err, src) {
        var c = {};
        vm.runInNewContext(src, c);
        t.equal(
            new c.require('buffer').Buffer("Ձאab", "utf8").toString("hex"),
            new Buffer("Ձאab", "utf8").toString("hex")
        );
    });
});

test('ascii buffer to base64', function (t) {
    t.plan(1);
    var b = browserify();
    b.require('buffer');
    
    b.bundle(function (err, src) {
        var c = {};
        vm.runInNewContext(src, c);
        t.equal(
            new c.require('buffer').Buffer("123456!@#$%^", "ascii").toString("base64"),
            new Buffer("123456!@#$%^", "ascii").toString("base64")
        );
    });
});

test('ascii buffer to hex', function (t) {
    t.plan(1);
    var b = browserify();
    b.require('buffer');
    b.bundle(function (err, src) {
        var c = {};
        vm.runInNewContext(src, c);
        t.equal(
            new c.require('buffer').Buffer("123456!@#$%^", "ascii").toString("hex"),
            new Buffer("123456!@#$%^", "ascii").toString("hex")
        );
    });
});

test('base64 buffer to utf8', function (t) {
    t.plan(1);
    var b = browserify();
    b.require('buffer');
    b.bundle(function (err, src) {
        var c = {};
        vm.runInNewContext(src, c);
        t.equal(
            new c.require('buffer').Buffer("1YHXkGFi", "base64").toString("utf8"),
            new Buffer("1YHXkGFi", "base64").toString("utf8")
        );
    });
});

test('hex buffer to utf8', function (t) {
    t.plan(1);
    var b = browserify();
    b.require('buffer');
    b.bundle(function (err, src) {
        var c = {};
        vm.runInNewContext(src, c);
        var B = c.require('buffer');
        t.equal(
            new B.Buffer("d581d7906162", "hex").toString("utf8"),
            new Buffer("d581d7906162", "hex").toString("utf8")
        );
    });
});

test('base64 buffer to ascii', function (t) {
    t.plan(1);
    var b = browserify();
    b.require('buffer');
    b.bundle(function (err, src) {
        var c = {};
        vm.runInNewContext(src, c);
        t.equal(
            new c.require('buffer').Buffer("MTIzNDU2IUAjJCVe", "base64").toString("ascii"),
            new Buffer("MTIzNDU2IUAjJCVe", "base64").toString("ascii")
        );
    });
});

test('hex buffer to ascii', function (t) {
    t.plan(1);
    var b = browserify();
    b.require('buffer');
    b.bundle(function (err, src) {
        var c = {};
        vm.runInNewContext(src, c);
        t.equal(
            new c.require('buffer').Buffer("31323334353621402324255e", "hex").toString("ascii"),
            new Buffer("31323334353621402324255e", "hex").toString("ascii")
        );
    });
});
