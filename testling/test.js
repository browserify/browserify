var test = require('testling');

test('nextTick', function (t) {
    var t0 = new Date;
    window.onload = function () {
        process.nextTick(function () {
            t.log(new Date - t0);
            t.end();
        });
    };
    if (document.readyState === 'complete') window.onload();
});
