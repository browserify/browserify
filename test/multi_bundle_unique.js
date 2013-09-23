var browserify = require('../');
var vm = require('vm');
var fs = require('fs');
var path = require('path');
var test = require('tap').test;
var prelude = fs.readFileSync(path.join(__dirname, '..', 'node_modules', 'browser-pack', '_prelude.js'), 'utf8')
  .replace(/require/g, 'unique_require')

test('unique require', function (t) {
    t.plan(5);

    var core = browserify();
    core.require(__dirname + '/multi_bundle/b.js', { expose: true });

    var app = browserify([__dirname + '/multi_bundle/a.js']);
    // inform this bundle that b exists in another bundle
    app.external(__dirname + '/multi_bundle/b.js');

    core.bundle({ globalRequire: 'unique_require', prelude: prelude }, function (err, src) {
        var c = {
            console: console,
            t : t,
            baton: {
                times: 0
            }
        };

        // loading core will cause no require to run
        vm.runInNewContext(src, c);
        t.equal(c.baton.times, 0);

        // loading the app will require
        app.bundle({ prelude: prelude }, function (err, src) {
            vm.runInNewContext(src, c);

            // b required for the first time
            t.equal(c.baton.times, 1);

            // Make sure require is not a global function,
            // and unique_require is.
            t.equal(typeof c.require, 'undefined');
            t.equal(typeof c.unique_require, 'function');
        });
    });
});

