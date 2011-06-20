var wrap = require('./lib/wrap');
var fs = require('fs');

module.exports = function (opts) {
    if (typeof opts === 'string') {
        opts = { require : [ opts ] };
    }
    else if (Array.isArray(opts)) {
        opts = { require : opts };
    }
    else if (typeof opts === 'object') {
        
    }
    if (!opts.require) opts.require = [];
    
    if (opts.base) {
        var files = fs.readDirSync(opts.base);
        opts.require = opts.require.concat(
            files.filter(function (file) { return file.match(/\.js$/) })
        );
    }
    
    var w = wrap(opts.require);
    var self = function (req, res, next) {
        // ...
    };
    
    Object.keys(w).forEach(function (key) {
        self[key] = w[key];
    });
    
    Object.keys(wrap.prototype).forEach(function (key) {
        self[key] = w[key].bind(w);
    });
    
    return self;
};
