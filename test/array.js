var browserify = require('../');
var vm = require('vm');
var test = require('tap').test;

test('array add', function (t) {
    var expected = [ 'ONE', 'TWO', 'THREE' ];
    t.plan(expected.length);
    
    var b = browserify();
    var files = [ 
        __dirname + '/array/one.js',
        __dirname + '/array/two.js',
        __dirname + '/array/three.js'
    ];
    b.add(files);
    b.bundle(function (err, src) {
        vm.runInNewContext(src, { console: { log: log } });
        function log (msg) {
            t.equal(msg, expected.shift());
        }
    });
});
