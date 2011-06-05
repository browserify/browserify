var fs = require('fs');
var path = require('path');
var EventEmitter = require('events').EventEmitter;
var Hash = require('hashish');
var Seq = require('seq');

var coffee = require('coffee-script');
var source = require('source');

var Package = require('./lib/package');

var exports = module.exports = function (opts) {
    if (!opts) opts = {};
    var modified = new Date();
    
    if (!opts.hasOwnProperty('watch')) opts.watch = true;
    var ee = opts.listen = opts.listen || new EventEmitter;
    
    ee.setMaxListeners(opts.maxListeners || 50);
    var listening = false;
    
    var srcCache = exports.bundle(opts);
    process.nextTick(function () {
        if (self.middlewares.length === 0) {
            ee.emit('ready', self.source());
        }
    });
    
    var self = function (req, res, next) {
        if (!listening) {
            req.connection.server.on('close', ee.emit.bind(ee, 'close'));
            ee.on('change', function (file) {
                var newCache = exports.bundle(opts);
                Seq.ap(self.middlewares)
                    .seqEach_(function (next, fn) {
                        fn(newCache, function (src) {
                            newCache = src;
                            next.ok(newCache);
                        });
                    })
                    .seq(function () {
                        srcCache = newCache;
                        ee.emit('ready', srcCache);
                        listening = false;
                    })
                ;
            });
            listening = true;
        }
        
        if (req.url.split('?')[0] === (opts.mount || '/browserify.js')) {
            res.writeHead(200, {
                'Last-Modified' : modified.toString(),
                'Content-Type' : 'text/javascript',
            });
            res.end(srcCache);
        }
        else next();
    };
    
    self.middlewares = [];
    
    var using = false;
    self.use = function (fn) {
        self.middlewares.push(fn);
        
        if (!using) {
            process.nextTick(function () {
                using = false;
                
                var newCache = srcCache;
                Seq.ap(self.middlewares)
                    .seqEach_(function (next, fn) {
                        fn.call(self, newCache, function (src) {
                            newCache = src;
                            next.ok(newCache);
                        });
                    })
                    .seq(function () {
                        srcCache = newCache;
                        ee.emit('ready', srcCache);
                    })
                ;
            });
        }
        using = true;
        return self;
    };
    
    self.on = function () {
        ee.on.apply(ee, arguments);
        return self;
    };
    
    self.source = function () {
        return srcCache;
    };
    
    return self;
};

exports.bundle = function (opts) {
    if (!opts) opts = {};
    if (typeof opts === 'string') {
        opts = { base : opts };
        var opts_ = arguments[1];
        if (typeof opts_ === 'object') {
            Object.keys(opts_).forEach(function (key) {
                opts[key] = opts_[key];
            });
        }
    }
    if (opts.main && opts.main.match(/^\//) && !opts.filename) {
        opts.filename = opts.main;
    }
    
    var shim = 'shim' in opts ? opts.shim : true;
    var req = opts.require || [];
    
    var src = fs.readFileSync(__dirname + '/wrappers/prelude.js', 'utf8')
        + fs.readFileSync(__dirname + '/wrappers/node_compat.js', 'utf8')
        + (shim ? source.modules('es5-shim')['es5-shim'] : '')
        + builtins
    ;
    
    var packages = [];
    var name = opts.name || '.';
    
    [ opts.require, opts.base ].forEach(function include (ps) {
        if (typeof ps === 'string') {
            packages.push(Package(name, ps));
        }
        else if (Array.isArray(ps)) {
            ps.forEach(function (p) {
                if (typeof p === 'object') {
                    include(p);
                }
                else {
                    packages.push(Package(name, p))
                }
            });
        }
        else if (typeof ps === 'object') {
            Hash(ps).forEach(function (p, key) {
                packages.push(Package(key, p));
            });
        }
    });
    
    packages.forEach(function (pkg) {
        src += pkg.toString();
    });
    
    if (opts.entry) {
        if (!Array.isArray(opts.entry)) {
            opts.entry = [ opts.entry ];
        }
        var entryBody = fs.readFileSync(
            __dirname + '/wrappers/entry.js', 'utf8'
        );
        
        opts.entry.forEach(function (entry) {
            fileWatch(entry, opts);
            src += entryBody
                .replace(/\$__filename/g, function () {
                    return JSON.stringify('./' + path.basename(entry))
                })
                .replace(/\$__dirname/g, function () {
                    return JSON.stringify('.')
                })
                .replace('$body', function () {
                    return (entry.match(/\.coffee$/) ? coffee.compile : String)(
                        fs.readFileSync(entry, 'utf8')
                    );
                })
            ;
        });
    }
    
    return opts.filter ? opts.filter(src) : src;
};

var wrapperBody = fs.readFileSync(__dirname + '/wrappers/body.js', 'utf8');

var builtins = fs.readdirSync(__dirname + '/builtins')
    .filter(function (file) {
        return file.match(/\.js$/)
            && !path.basename(file).match(/^\./)
    })
    .map(function (file) {
        var f = __dirname + '/builtins/' + file;
        var src = fs.readFileSync(f, 'utf8').replace(/^#![^\n]*\n/, '');
        
        return wrapperBody
            .replace(/\$__dirname/g, function () {
                return JSON.stringify(path.dirname(file));
            })
            .replace(/\$__filename/g, function () {
                return JSON.stringify(file);
            })
            .replace('$body', function () {
                return src;
            })
        ;
    })
    .join('\n')
;

var watchedFiles = [];
function fileWatch (file, opts) {
    if (!opts.watch) return;
    
    var unwatch = function () { fs.unwatchFile(file) };
    
    if (opts.listen) opts.listen.on('close', unwatch);
    
    watchedFiles.push(file);
    var wopts = {
        persistent : opts.watch.hasOwnProperty('persistent')
            ? opts.watch.persistent
            : true
        ,
        interval : opts.watch.interval || 500,
    };
    
    fs.watchFile(file, wopts, function (curr, prev) {
        if (curr.mtime - prev.mtime == 0) return;
        watchedFiles.forEach(function(file, i) {
            fs.unwatchFile(file);
            delete watchedFiles[i];
        });
        
        if (opts.verbose) {
            console.log('File change detected, regenerating bundle');
        }
        
        opts.listen.removeListener('close', unwatch);
        opts.listen.emit('change', file);
    });
}
