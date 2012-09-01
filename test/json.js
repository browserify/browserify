var browserify = require('../');
var vm = require('vm');
var test = require('tap').test;

test('json', function (t) {
    t.plan(1);
    var b = browserify(__dirname + '/json/main.js');
    b.on('syntaxError', t.fail.bind(t));
    var src = b.bundle();
    
    var c = {
        ex : function (obj) {
            t.same(obj, { beep : 'boop', x : 555 });
        }
    };
    vm.runInNewContext(src, c);
});
