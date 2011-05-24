var z = require('../zz/z.js')
assert.equal(require('quux/zz/z'), z);

module.exports = function (x) {
    return z(10 + x);
};
