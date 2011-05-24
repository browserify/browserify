assert.equal(require('../aa/a.js'), require('quux/aa/a'));

module.exports = function (n) {
    return n * 1000;
};
