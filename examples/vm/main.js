var vm = require('vm');
var $ = require('jquery');

$(window).ready(function () {
    var res = vm.runInNewContext('a + 2 * b', { a : 5, b : 4 });
    $('#result').text(res);
});
