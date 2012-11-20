var http = require('http');
var vm = require('vm');
var browserify = require('../');

var test = require('tap').test;

test('alias', function (t) {
    t.plan(2);
    
    var b = browserify()
    b.require('seq');
    var src = b.bundle();
    
    var context = {
        setTimeout : setTimeout,
        console : console
    };
    
    vm.runInNewContext(src, context);
    t.ok(context.require('seq'));
    
    context.require('seq')([1,2,3])
        .parMap(function (x) {
            this(null, x * 100)
        })
        .seq(function () {
            t.deepEqual(this.stack, [100,200,300]);
            t.end();
        })
    ;
});
