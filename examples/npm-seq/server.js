var connect = require('connect');
var server = connect.createServer();

server.use(connect.staticProvider(__dirname));
server.use(require('browserify')({
    mount : '/browserify.js',
    require : [ 'seq' ], // which itself has dependencies
}));

server.listen(9797);
console.log('Listening on 9797...');
