var http = require('http');
var vm = require('vm');
var browserify = require('../');
var test = require('tap').test;

test('seq', function (t) {
    t.plan(1);
    
    var src = browserify({ require : [ 'seq' ] }).bundle();
    var context = { setTimeout : setTimeout };
    vm.runInNewContext(src, context);
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
