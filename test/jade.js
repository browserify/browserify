var browserify = require('../');
var vm = require('vm');
var jade = require('jade');
var test = require('tap').test;

test('jade', function (t) {
    t.plan(5);
    var b = browserify({
        require : 'jade',
        ignore : [ 'stylus', 'markdown', 'discount', 'markdown-js' ]
    });
    var src = b.bundle();
    
    t.ok(typeof src === 'string');
    t.ok(src.length > 0);
    
    var c = { console : console };
    vm.runInNewContext(src, c);
    var j = c.require('jade');
    t.deepEqual(
        Object.keys(jade),
        Object.keys(j)
    );
    
    var r = jade.render('div #{x}\n  span moo', { locals : { x : 42 } });
    t.equal(r, '<div>42<span>moo</span></div>');
    t.equal(
        j.render('div #{x}\n  span moo', { locals : { x : 42 } }),
        r
    );
    t.end();
});
