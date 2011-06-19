var assert = require('assert');
var path = require('path');
var wrapper = require('../lib/wrap');

exports.wrap = function () {
    wrapper(__dirname + '/wrap/a.js', function (err, files) {
        if (err) assert.fail(err);
        
        assert.deepEqual(Object.keys(files).sort(), [
            __dirname + '/wrap/a.js',
            __dirname + '/wrap/node_modules/b/main.js',
            __dirname + '/wrap/c.js',
            __dirname + '/wrap/x.js',
            path.resolve(__dirname, '../builtins/vm.js'),
        ].sort());
        
    });
};
