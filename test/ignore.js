var browserify = require('../');
var test = require('tap').test;
var vm = require('vm');

test('ignore', function (t) {
    t.plan(1);
    
    var b = browserify();
    b.add(__dirname + '/ignore/main.js');
    b.ignore( __dirname + '/ignore/skip.js');
    
    b.bundle(function (err, src) {
        if (err) t.fail(err);
        vm.runInNewContext(src, { t: t });
    });
});
