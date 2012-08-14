var browserify = require('../');
var test = require('tap').test;
var path = __dirname + '/multi_entry/'

test('noParse', function (t) {

    var bundle = browserify(path + 'a.js', {
        noParse : [
            path + 'b.js'
        ]
    });
    t.ok(bundle.noParsing[path + 'b.js']);

    bundle.noParse(path + 'c.js');
    t.ok(bundle.noParsing[path + 'b.js']);
    t.ok(bundle.noParsing[path + 'c.js']);

    bundle.noParse(path + 'd.js');
    t.ok(bundle.noParsing[path + 'b.js']);
    t.ok(bundle.noParsing[path + 'c.js']);
    t.ok(bundle.noParsing[path + 'd.js']);

    t.end();
});

