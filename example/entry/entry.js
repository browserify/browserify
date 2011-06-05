// entry point for browser code

var foo = require('./foo');

window.onload = function () {
    document.getElementById('result').innerHTML = foo(100);
};
