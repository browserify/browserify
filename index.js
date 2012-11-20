var path = require('path');
var coffee = require('coffee-script');
var EventEmitter = require('events').EventEmitter;

var wrap = require('./lib/wrap');

function idFromPath (path) {
    return path.replace(/\\/g, '/');
}

function isAbsolute (pathOrId) {
    return path.normalize(pathOrId) === path.normalize(path.resolve(pathOrId));
}

function needsNodeModulesPrepended (id) {
    return !/^[.\/]/.test(id) && !isAbsolute(id);
}

exports = module.exports = function (entryFile, opts) {
    if (!opts) opts = {};
    if (typeof entryFile === 'object') {
        opts = entryFile;
        entryFile = undefined;
    }
    else {
        opts.entry = entryFile;
    }
    
    
    if (!Array.isArray(opts.entry)) {
        opts.entry = opts.entry ? [ opts.entry ] : [];
    }
    
    var opts_ = {
        cache : opts.cache,
        debug : opts.debug,
        exports : opts.exports,
    };
    var w = wrap(opts_);
    if (opts.entry) opts.entry.forEach(function (e) { w.addEntry(e) });
    
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
    
    if (opts.watch) watch(w, opts.watch);
    
    if (opts.filter) {
        w.register('post', function (body) {
            return opts.filter(body);
        });
    }
    
    w.ignore(opts.ignore || []);
    
    if (opts.require) {
        if (Array.isArray(opts.require)) {
            opts.require.forEach(function (r) {
                r = idFromPath(r);

                var params = {};
                if (needsNodeModulesPrepended(r)) {
                    params.target = '/node_modules/' + r + '/index.js';
                }
                w.require(r, params);
            });
        }
        else if (typeof opts.require === 'object') {
            Object.keys(opts.require).forEach(function (key) {
                opts.require[key] = idFromPath(opts.require[key]);

                var params = {};
                if (needsNodeModulesPrepended(opts.require[key])) {
                    params.target = '/node_modules/'
                        + opts.require[key] + '/index.js'
                    ;
                }
                w.require(opts.require[key], params);
                w.alias(key, opts.require[key]);
            });
        }
        else {
            opts.require = idFromPath(opts.require);

            var params = {};
            if (needsNodeModulesPrepended(opts.require)) {
                params.target = '/node_modules/'
                    + opts.require + '/index.js'
                ;
            }
            w.require(opts.require, params);
        }
    }
    
    return w;
};

exports.bundle = function (opts) {
    return exports(opts).bundle();
};
