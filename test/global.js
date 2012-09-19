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
        window : { a : 555 }
    };
    vm.runInNewContext(src, c);
});
