var wrap = require('./lib/wrap');
var fs = require('fs');
var path = require('path');

var exports = module.exports = function (opts) {
    if (typeof opts === 'string') {
        opts = { require : [ opts ] };
    }
    else if (Array.isArray(opts)) {
        opts = { require : opts };
    }
    else if (typeof opts === 'object') {
        throw new Error('not implemented')
    }
    
    if (!opts.require) opts.require = [];
    
    if (opts.base) {
        throw new Error('base is no longer a valid parameter');
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

exports.bundle = function (opts) {
    return exports(opts).bundle();
};
