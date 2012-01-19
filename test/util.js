var browserify = require('../');
var test = require('tap').test;
var util = require('util');
var vm = require('vm');

test('util.inspect', function (t) {
    t.plan(1);
    var src = browserify().require('util').bundle();
    var c = {};
    vm.runInNewContext(src, c);
    t.equal(
        c.require('util').inspect([1,2,3]),
        util.inspect([1,2,3])
    );
    t.end();
});
