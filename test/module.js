var vm = require('vm');
var browserify = require('../');
var test = require('tap').test;

test('module', function (t) {
    t.plan(6);

    var src = browserify().require('seq').bundle();
    var c = {};
    vm.runInNewContext(src, c);
    var seqPath = c.require.resolve('seq');

    var seq = c.require('seq');
    var module = c.require.cache[seqPath];

    t.equal(module.id, seqPath);
    t.equal(module.filename, seqPath);
    t.equal(module.exports, seq);
    t.equal(module.loaded, true);
    t.equal(module.parent, null);
    t.equal(c.require.cache["/node_modules/hashish/index.js"].parent, module);
});
