clearTimeout(to);

assert.deepEqual(
    Object.keys(require.modules).filter(function (x) { return x.match(/^\./) }),
    ['./moo']
);

assert.equal(require('./moo').zzz(3), 333);
