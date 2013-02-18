var vm = require('vm');
var browserify = require('../');
var test = require('tap').test;

test('dnode', function (t) {
    t.plan(2);
    
    var b = browserify();
    b.require('dnode');
    
    var c = {
        console : console,
        navigator : {
            userAgent : 'foo',
            platform : 'bar',
        },
        window : {
            addEventListener : function () {},
        },
        document : {},
    };
    
    b.bundle(function (err, src) {
        vm.runInNewContext(src, c);
        var dnode = c.require('dnode');
        
        t.ok(dnode, 'dnode object exists');
        t.ok(dnode.connect, 'dnode.connect exists');
        
        t.end();
    });
});
