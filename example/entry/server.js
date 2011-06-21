var connect = require('connect');
var server = connect.createServer();

server.use(connect.static(__dirname));
server.use(require('browserify')({
    entry : __dirname + '/js/entry.js',
    watch : true,
}));

server.listen(9393);
console.log('Listening on 9393...');
