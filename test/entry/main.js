assert.deepEqual(
    Object.keys(require.modules).filter(function (x) { return x.match(/^\./) }),
    ['./moo']
);

entryResult = require('./moo').zzz(3);
