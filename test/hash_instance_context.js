var browserify = require('../');
var vm = require('vm');
var test = require('tap').test;

test('hash instances with hashed contexts', function (t) {
    t.plan(11);
    
    var b = browserify(__dirname + '/hash_instance_context/main.js');
    b.bundle(function (err, src) {
        var c = { t: t };
        t.equal(src.match(RegExp('// FILE F ONE', 'g')).length, 1);
        t.equal(src.match(RegExp('// FILE G ONE', 'g')).length, 2);
        
        t.equal(src.match(RegExp('// FILE F TWO', 'g')).length, 1);
        t.equal(src.match(RegExp('// FILE G TWO', 'g')).length, 1);
        t.equal(src.match(RegExp('// FILE H TWO', 'g')).length, 2);
        
        vm.runInNewContext(src, c);
    });
});
