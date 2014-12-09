var browserify = require('../');
var vm = require('vm');
var test = require('tap').test;

function ensureTransform(t, buf) {
  var srcAsString = (buf||'').toString('utf-8'),
      containsAX = srcAsString.indexOf('AX') > -1,
      containsAZ = srcAsString.indexOf('AZ') > -1;
  t.notOk(containsAX,"should not contain AX's");
  t.ok(containsAZ,"should contain AZ's");
}

test('absolute paths with transform property', function (t) {
  t.plan(5);

  var b = browserify({
    transform: ['tr'],
    paths: [ __dirname + '/paths/x', __dirname + '/paths/y' ],
    entries: __dirname + '/paths/main.js'
  });
  b.bundle(function (err, src) {
    if (err) t.fail(err);
    ensureTransform(t,src);
    vm.runInNewContext(src, { t: t });
  });
});

test('relative paths with transform property', function (t) {
  t.plan(5);

  var b = browserify({
    transform: ['tr'],
    paths: ['./test/paths/x', './test/paths/y' ],
    entries: __dirname + '/paths/main.js'
  });
  b.bundle(function (err, src) {
    if (err) t.fail(err);
    ensureTransform(t,src);
    vm.runInNewContext(src, { t: t });
  });
});


test('absolute paths with transform method', function (t) {
  t.plan(5);

  var b = browserify({
    paths: [ __dirname + '/paths/x', __dirname + '/paths/y' ],
    entries: __dirname + '/paths/main.js'
  });
  b.transform('tr');
  b.bundle(function (err, src) {
    if (err) t.fail(err);
    ensureTransform(t,src);
    vm.runInNewContext(src, { t: t });
  });
});


test('relative paths with transform method', function (t) {
  t.plan(3);
  var b = browserify({
    paths: ['./test/paths/x', './test/paths/y' ],
    entries: __dirname + '/paths/main.js'
  });
  b.transform('tr');
  b.bundle(function (err, src) {
    if (err) t.fail(err);
    ensureTransform(t,src);
    vm.runInNewContext(src, { t: t });
  });
});
