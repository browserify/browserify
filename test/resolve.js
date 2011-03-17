var assert = require('assert');
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var prelude = path.dirname(require.resolve('browserify'))
    + '/wrappers/prelude.js';

var context = {};
vm.runInNewContext(fs.readFileSync(prelude, 'utf8'), context);

var resolve = context.require.resolve;

exports.resolve = function () {
    assert.eql(
        resolve('/foo/bar/baz/quux.js', '../../here'),
        '/foo/here'
    );
    assert.eql(
        resolve('/foo/bar/baz/quux.js', './a/b/../../here'),
        '/foo/bar/baz/here'
    );
};
