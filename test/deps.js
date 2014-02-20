var browserify = require('../');
var vm = require('vm');
var test = require('tap').test;
var through = require('through');

test('deps', function (t) {
    t.plan(1);
    var b = browserify(__dirname + '/ignore/by-id.js');
    b.exclude('events');
    b.exclude('beep');
    b.exclude('bad id');
    b.exclude('./skip.js');
    var deps = [];
    b.deps()
      .pipe(through(function (row) {
        deps.push({ id: row.id, deps: row.deps });
      }))
      .on('end', function () {
          t.deepEqual(deps.sort(cmp), [
              { id: __dirname + '/ignore/by-id.js', deps: {} }
          ]);
      });

    function cmp (a, b) {
        return a.id < b.id ? -1 : 1;
    }
});
