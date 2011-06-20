var wrap = require('./lib/wrap');
var fs = require('fs');
var path = require('path');
var coffee = require('coffee-script');

var exports = module.exports = function (opts) {
    if (!opts) {
        opts = {};
    }
    else if (Array.isArray(opts)) {
        opts = { require : opts };
    }
    else if (typeof opts !== 'object') {
        opts = { require : [ opts ] };
    }
    
    if (!opts.require) opts.require = [];
    
    if (opts.base) {
        throw new Error('base is no longer a valid parameter');
    }
    
    var w = wrap()
        .use('.coffee', function (body) {
            return coffee.compile(body)
        })
        .ignore(opts.ignore)
        .require(opts.require)
    ;
    
    if (opts.entry) {
        if (Array.isArray(opts.entry)) {
            opts.entry.forEach(function (e) {
                w.addEntry(e);
            });
        }
        else {
            w.addEntry(opts.entry);
        }
    }
    
    var modified = new Date();
    var _cache = null;
    var self = function (req, res, next) {
        if (!_cache) self.bundle();
        
        if (req.url.split('?')[0] === (opts.mount || '/browserify.js')) {
            res.statusCode = 200;
            res.setHeader('last-modified', modified.toString());
            res.setHeader('content-type', 'text/javascript');
            res.end(_cache);
        }
    };
    
    Object.keys(w).forEach(function (key) {
        self[key] = w[key];
    });
    
    Object.keys(wrap.prototype).forEach(function (key) {
        self[key] = w[key].bind(w);
    });
    
    self.bundle = function () {
        var src = w.bundle.apply(w, arguments);
        _cache = src;
        return src;
    };
    
    return self;
};

exports.bundle = function (opts) {
    return exports(opts).bundle();
};
