var browserify = require('../');
var test = require('tap').test;

test('identical content gets deduped and the row gets an implicit dep on the original source', function (t) {
  t.plan(1)

  var rows = [];
  browserify()
    .on('dep', [].push.bind(rows))
    .require(require.resolve('./dup'), { entry: true })
    .bundle(check);

  function check(err, src) {
    if (err) return t.fail(err);
    var deduped = rows.filter(function (x) { return x.dedupeIndex });
    var d = deduped[0];
    var deps = {};
    deps[d.dedupe] = d.dedupeIndex;

    t.deepEqual(d.deps, deps, "adds implicit dep");
  }
})

test('identical content gets deduped with fullPaths', function (t) {
  t.plan(1)

  var rows = [];
  browserify({fullPaths: true})
    .on('dep', [].push.bind(rows))
    .require(require.resolve('./dup'), { entry: true })
    .bundle(check);

  function check(err, src) {
    if (err) return t.fail(err);
    var deduped = rows.filter(function (x) { return x.dedupe });
    var d = deduped[0];

    t.deepEqual(d.source, 'module.exports=require('+ JSON.stringify(d.dedupe) + ')', "dedupes content");
  }
})
