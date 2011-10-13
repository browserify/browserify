var connect = require('connect');
var server = connect.createServer();
server.use(connect.static(__dirname));

var browserify = require('browserify');
var bundle = browserify(__dirname + '/js/entry.js');
server.use(bundle);

server.listen(8080);
console.log('Listening on :8080');
