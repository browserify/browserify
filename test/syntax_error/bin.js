var browserify = require('browserify');
var vm = require('vm');

var main = __dirname + '/main.js';

var b = browserify({
    entry : main,
    watch : { interval : 50 },
});

b.on('syntaxError', function (err) {
    console.log('caught');
    if (b.bundle() === src) {
        console.log('ok');
    }
    else {
        console.log('fail');
    }
});

var src = b.bundle();
try {
    vm.runInNewContext(src, {
        console : {
            log : function (s) {
                console.log('log ' + s);
            }
        },
    });
}
catch (err) {
    console.log('error ' + err.toString());
}
