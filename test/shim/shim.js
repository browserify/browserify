module.exports = function () {
    var xs = [ 5, 6, 7, 8, 9, 10 ];
    return xs.filter.bind(xs, function (x) { return x % 2 !== 0 })();
};
