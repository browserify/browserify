var browserify = require('../');
var vm = require('vm');
var test = require('tap').test;

test('json', function (t) {
    t.plan(1);
    var src = browserify(__dirname + '/json/main.js').bundle();
    var c = {
        export : function (obj) {
            t.same(obj, { beep : 'boop', x : 555 });
        }
    };
    vm.runInNewContext(src, c);
});
