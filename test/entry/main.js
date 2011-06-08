clearTimeout(to);

assert.deepEqual(
    Object.keys(require.modules).filter(
        function (x) { return x.match(/^\./) }
    ).sort(),
    [ './moo.js', './package.json' ]
);

assert.equal(require('./moo').zzz(3), 333);
