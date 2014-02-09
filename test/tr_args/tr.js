var through = require('through');

module.exports = function (file, opts) {
    var data = '';
    return through(write, end);
    
    function write (buf) { data += buf }
    function end () {
        this.queue(data.replace(/X/g, opts.x));
        this.queue(null);
    }
};
