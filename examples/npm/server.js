var connect = require('connect');
var server = connect.createServer();

server.use(connect.staticProvider(__dirname));
server.use(require('browserify')({
    mount : '/browserify.js',
    require : [ 'traverse' ],
}));

server.listen(9696);
console.log('Listening on 9696...');
