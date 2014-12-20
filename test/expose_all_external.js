var browserify = require('../');
var vm = require('vm');
var test = require('tap').test;

test('external handling with exposeAll configured', function (t) {
    t.plan(1);
    
    var b = browserify(__dirname + '/expose_all_external/main.js', { exposeAll: true });
    b.external('freelist');
    b.bundle(function (err, src) {
        if (err) return t.fail(err);
        vm.runInNewContext(
            'function require (x) {'
            + 'if (x==="freelist") return function (n) { return n + 1000 }'
            + '}'
            + src,
            { t: t }
        );
    });
});
