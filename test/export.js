var browserify = require('../');
var vm = require('vm');
var test = require('tap').test;

test('only export require', function (t) {
    t.plan(2);
    var src = browserify().bundle();
    var c = {};
    vm.runInNewContext(src, c);
    t.same(Object.keys(c), [ 'require' ]);
});

test('no exports when entries are defined', function (t) {
    t.plan(2);
    var src = browserify(__dirname + '/export/entry.js').bundle();
    var c = {};
    vm.runInNewContext(src, c);
    t.same(c, {});
});

test('override export behavior', function (t) {
    t.plan(2);
    var src = browserify({ export : [ 'require' ] })
        .addEntry(__dirname + '/export/entry.js')
        .bundle()
    ;
    var c = {};
    vm.runInNewContext(src, c);
    t.same(Object.keys(c), [ 'require' ]);
});

test('export process', function (t) {
    t.plan(2);
    var src = browserify({ export : [ 'process' ] })
        .addEntry(__dirname + '/export/entry.js')
        .bundle()
    ;
    var c = {};
    vm.runInNewContext(src, c);
    t.same(Object.keys(c), [ 'process' ]);
});

test('export require and process', function (t) {
    t.plan(2);
    var src = browserify({ export : [ 'require', 'process' ] })
        .addEntry(__dirname + '/export/entry.js')
        .bundle()
    ;
    var c = {};
    vm.runInNewContext(src, c);
    t.same(Object.keys(c), [ 'require', 'process' ]);
});
