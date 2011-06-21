var connect = require('connect');
var server = connect.createServer();

server.use(connect.static(__dirname));
server.use(require('browserify')({
    mount : '/browserify.js',
    require : [ 'jade' ],
    ignore : [ 'stylus', 'markdown', 'discount', 'markdown-js' ]
}));

server.listen(9393);
console.log('Listening on 9393...');
