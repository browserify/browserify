var assert = require('assert');
var wrapper = require('../lib/wrap');

exports.wrap = function () {
    wrapper(__filename, function (err, files) {
        if (err) assert.fail(err);
        
        console.log('doom');
        console.dir(Object.keys(files));
    });
};
