var browserify = require('../');
var vm = require('vm');
var test = require('tap').test;

test('external', function (t) {
    t.plan(2);
    var baseDir = __dirname;
    var splitFile = baseDir + '/external_basedir/y.js';
    var mainSrc = '';
    var splitSrc = '';
    var pending = 2;

    // main bundle should not include splitFile
    var b = browserify(baseDir + '/external_basedir/main.js', {basedir: baseDir});
    b.external(splitFile); // no need to specify basedir option if it is already set for b
    b.bundle(function (err, src) {
        if (err) return t.fail(err);
        mainSrc = src;
        pending--;
        done();
    });

    // consider b2 as for split or vendor bundle
    var b2 = browserify([], {basedir: baseDir});
    b2.require(splitFile, {expose: splitFile.replace(baseDir, '')});
    b2.bundle(function (err, src) {
        if (err) return t.fail(err);
        splitSrc = src;
        pending--;
        done();
    });

    function done() {
        if (pending !== 0) {
            return;
        }
        vm.runInNewContext(splitSrc + mainSrc, { t: t });
    }
});
