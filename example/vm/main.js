var vm = require('vm');

var fn = window.onload = function () {
    var res = vm.runInNewContext('a + 2 * b', { a : 5, b : 4 });
    document.getElementById('result').innerHTML = res;
};

if (document.readyState === 'complete') fn();
