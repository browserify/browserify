var through = require('through');

module.exports = function (file, opts) {
    var data = '';
    return through(write, end);
    
    function write (buf) { data += buf }
    function end () {
        this.emit('error', new Error('there was error'))
        this.queue(null);
    }
};
