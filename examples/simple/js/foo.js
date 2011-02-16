var bar = require('./bar');
var baz = require('./baz');

module.exports = function (x) {
    return x * bar.coeff(x) + baz.wowsy(x);
};
