assert.ok(require('../aa/a.js'));
assert.equal(require('../aa/a.js'), require('../aa/a'));

module.exports = function (n) {
    return n * 1000;
};
