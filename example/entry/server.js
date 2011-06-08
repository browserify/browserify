var connect = require('connect');
var server = connect.createServer();

server.use(connect.static(__dirname));
server.use(require('browserify')({
    base : __dirname + '/js',
    entry : __dirname + '/entry.js',
}));

server.listen(9393);
console.log('Listening on 9393...');
