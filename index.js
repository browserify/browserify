var path = require('path');
var coffee = require('coffee-script');
var EventEmitter = require('events').EventEmitter;

var wrap = require('./lib/wrap');

exports = module.exports = function (files, opts) {
    if (!opts) opts = {};
    if (typeof files === 'object') {
        opts = files;
        files = [];
    }
    files = [].concat(files).filter(Boolean);
    
    var w = wrap(opts);
    
    w.register('.coffee', function (body, file) {
        try {
            var res = coffee.compile(body, { filename : file });
        }
        catch (err) {
            w.emit('syntaxError', err);
        }
        return res;
    });
    
    w.register('.json', function (body, file) {
        return 'module.exports = ' + body + ';\n';
    });
    
    if (opts.filter) {
        w.register('post', function (body) {
            return opts.filter(body);
        });
    }
    
    w.ignore(opts.ignore || []);
    
    files.forEach(function (file) { w.addEntry(file) });
    
    return w;
};

exports.bundle = function (opts) {
    return exports(opts).bundle();
};
