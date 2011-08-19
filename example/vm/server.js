var connect = require('connect');
var server = connect.createServer();

server.use(connect.static(__dirname));
server.use(require('browserify')({
    entry : __dirname + '/main.js',
    watch : true
}));

server.listen(8080);
console.log('Listening on 8080...');
