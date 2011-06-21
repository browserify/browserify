var assert = require('assert');
var browserify = require('browserify');
var vm = require('vm');

exports.fieldString = function () {
    var dir = __dirname + '/field/';
    var src = browserify(dir + '/string.js').bundle();
    
    var c = {};
    vm.runInNewContext(src, c);
    assert.equal(
        c.require('./string.js'),
        'browser'
    );
};
