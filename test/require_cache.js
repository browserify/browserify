var vm = require('vm');
var browserify = require('../');
var test = require('tap').test;

test('require.cache', function (t) {
    t.plan(3);
    
    var src = browserify().require('seq').bundle();
    var c = {};
    vm.runInNewContext(src, c);
    var seqPath = c.require.resolve('seq');
    t.equal(c.require.cache[seqPath], undefined);
    
    var seq = c.require('seq');
    t.equal(seq, c.require.cache[seqPath].exports);
    var seqCached = c.require('seq');   // check if require() uses the cache
    t.equal(seq, seqCached);
});
