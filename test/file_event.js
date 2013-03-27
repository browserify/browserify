var browserify = require('../');
var vm = require('vm');
var test = require('tap').test;

test('file event', function (t) {
    t.plan(8);
    
    var b = browserify(__dirname + '/entry/main.js');
    var files = [ 'main.js', 'one.js', 'two.js' ];
    var ids = [ __dirname + '/entry/main.js', './one', './two' ];
    
    b.on('file', function (file, id) {
        t.equal(file, __dirname + '/entry/' + files.shift());
        t.equal(id, ids.shift());
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
