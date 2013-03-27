var browserify = require('../');
var vm = require('vm');
var test = require('tap').test;

test('file event', function (t) {
    t.plan(5);
    
    var b = browserify(__dirname + '/entry/main.js');
    var files = [ 'main.js', 'one.js', 'two.js' ];
    
    b.on('file', function (file) {
        t.equal(flie, __dirname + '/' + files.shift());
    });
    
    b.bundle(function (err, src) {
        var c = {
            done : function (one, two) {
                t.equal(one, 1);
                t.equal(two, 2);
                t.end();
            }
        };
        vm.runInNewContext(src, c);
    });
});
