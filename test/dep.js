var browserify = require('../');
var vm = require('vm');
var test = require('tap').test;

var fs = require('fs');
var shasum = require('shasum');
var sources = {
    main: fs.readFileSync(__dirname + '/entry/main.js', 'utf8'),
    one: fs.readFileSync(__dirname + '/entry/one.js', 'utf8'),
    two: fs.readFileSync(__dirname + '/entry/two.js', 'utf8')
};
var hashes = {
    main: shasum(sources.main).slice(0,8),
    one: shasum(sources.one).slice(0,8),
    two: shasum(sources.two).slice(0,8)
};

test('dependency events', function (t) {
    t.plan(4);
    var b = browserify(__dirname + '/entry/main.js');
    var deps = [];
    b.on('dep', function (row) {
        deps.push({ id: row.id, deps: row.deps });
        t.equal(typeof row.source, 'string');
    });
    
    b.bundle(function (err, src) {
        t.deepEqual(deps.sort(cmp), [
            {
                id: hashes.main,
                deps: { './one': hashes.one, './two': hashes.two }
            },
            { id: hashes.two, deps: {} },
            { id: hashes.one, deps: {} }
        ]);
    });
    
    function cmp (a, b) {
        return a.id < b.id ? -1 : 1;
    }
});
