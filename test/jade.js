var assert = require('assert');
var browserify = require('browserify');
var vm = require('vm');
var jade = require('jade');

exports.jade = function () {
    var src = browserify.bundle({
        require : 'jade'
    });
    assert.ok(typeof src === 'string');
    assert.ok(src.length > 0);
    
    var c = { console : console };
    vm.runInNewContext(src, c);
    var j = c.require('jade');
    assert.eql(
        Object.keys(jade),
        Object.keys(j)
    );
    
    var r = jade.render('div #{x}\n  span moo', { locals : { x : 42 } });
    assert.eql(r, '<div>42<span>moo</span></div>');
    assert.eql(
        j.render('div #{x}\n  span moo', { locals : { x : 42 } }),
        r
    );
};
