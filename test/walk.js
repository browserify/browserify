var assert = require('assert');
var vm = require('vm');
var browserify = require('browserify');
var util = require('util');

exports.walk = function () {
    var src = browserify.bundle(__dirname + '/walk');
    var context = {};
    
    vm.runInNewContext(src, context);
    
    var a_ = context.require('a');
    var b_ = context.require('b');
    var c_ = context.require('c');
    
    assert.throws(function () {
        context.require('d');
    });
    
    assert.throws(function () {
        context.require('e');
    });
    
    var a = { self : 'a' };
    var b = { self : 'b' };
    var c = { self : 'c' };
    var d = { self : 'd' };
    var e = { self : 'e' };
    
    a.a = a;
    a.b = b;
    a.c = c;
    
    b.a = a;
    b.b = b;
    b.c = c;
    
    c.a = a;
    c.b = b;
    c.c = c;
    c.d = d;
    
    d.a = a;
    d.b = b;
    d.c = c;
    d.d = d;
    d.e = e;
    
    e.a = a;
    e.b = b;
    e.c = c;
    e.d = d;
    e.e = e;
    
    assert.equal(
        util.inspect(a),
        util.inspect(a_)
    );
};
