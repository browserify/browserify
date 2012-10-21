var browserify = require('../');
var vm = require('vm');
var test = require('tap').test;

test('global', function (t) {
    t.plan(2);
    
    var src = browserify()
        .addEntry(__dirname + '/global/main.js')
        .bundle()
    ;
    
    var c = {
        t : t,
        a : 555,
    };
    c.window = c;
    vm.runInNewContext(src, c);
});
