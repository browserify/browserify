var fs = require('fs');
var path = require('path');

// not many node installs have path.relative yet >_<
var pathDotRelative = require('file').path.relativePath;

var EventEmitter = require('events').EventEmitter;
var Hash = require('hashish');
var Seq = require('seq');

var coffee = require('coffee-script');
var source = require('source');

var Package = require('./lib/package');
var watchFile = require('./lib/watch');

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
                Seq(self.middlewares)
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
                Seq(self.middlewares)
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
    
    var shim = 'shim' in opts ? opts.shim : true;
    var req = opts.require || [];
    
    var src = fs.readFileSync(__dirname + '/wrappers/prelude.js', 'utf8')
        + fs.readFileSync(__dirname + '/wrappers/node_compat.js', 'utf8')
        + (shim ? source.modules('es5-shim')['es5-shim'] : '')
        + builtins
    ;
    
    var packages = [];
    
    var resolve = function (p) {
        if (p.match(/^[.\/]/)) return p;
        
        try {
            return path.dirname(require.resolve(p + '/package.json'));
        }
        catch (err) {
            return p.match(/\.js$/)
                ? require.resolve(p)
                : path.dirname(require.resolve(p))
            ;
        }
    };
    
    if (typeof opts.require === 'string') {
        packages.push(Package(opts.require, resolve(opts.require), null, tPkg));
    }
    else if (Array.isArray(opts.require)) {
        opts.require.forEach(function (ps) {
            if (typeof ps === 'object') {
                Hash(ps).forEach(function (p, key) {
                    packages.push(Package(key, resolve(p), null, tPkg));
                });
            }
            else {
                packages.push(Package(ps, resolve(ps), null, tPkg));
            }
        });
    }
    else if (typeof opts.require === 'object') {
        Hash(opts.require).forEach(function (p, key) {
            packages.push(Package(key, resolve(p), null, tPkg));
        });
    }
    
    var name = opts.name || '.';
    var tPkg = {
        listen : opts.listen,
        watch : opts.watch,
        base : opts.base,
    };
    
    if (opts.main && !opts.base) {
        tPkg.main = path.basename(opts.main);
        
        packages.push(Package(name, path.dirname(opts.main), null, tPkg));
    }
    else if (typeof opts.base === 'string') {
        if (opts.main) {
            tPkg.main = opts.main.match(/^\//)
                ? pathDotRelative(opts.base, opts.main)
                : opts.main
            ;
        }
        
        packages.push(Package(name, resolve(opts.base), null, tPkg));
    }
    else if (Array.isArray(opts.base)) {
        opts.base.forEach(function (ps) {
            if (typeof ps === 'object') {
                Hash(ps).forEach(function (p, key) {
                    packages.push(Package(key, resolve(p), null, tPkg));
                });
            }
            else {
                packages.push(Package(name, resolve(ps), null, tPkg));
            }
        });
    }
    else if (typeof opts.base === 'object') {
        Hash(opts.base).forEach(function (p, key) {
            packages.push(Package(key, resolve(p), null, tPkg));
        });
    }
    
    src += Package.merge(packages);
    var deps = packages.reduce(function (acc, p) {
        if (p.name) acc[p.name] = true;
        return acc;
    }, {});
    
    (function processDeps (pkgs) {
        if (pkgs.length === 0) return;
        
        var newDeps = {};
        
        pkgs.forEach(function (pkg) {
            if (!deps[pkg.name]) {
                deps[pkg.name] = true;
                src += pkg.toString();
            }
            
            Object.keys(pkg.dependencies.needs).forEach(function (dep) {
                var dir = pkg.basedir + '/node_modules/' + dep;
                if (!deps[dep] && !path.existsSync(dir)) {
                    newDeps[dep] = true;
                }
            });
        });
        
        processDeps(Object.keys(newDeps).map(function (dep) {
            return Package(dep, resolve(dep), null, tPkg);
        }));
    })(packages);
    
    if (opts.entry) {
        if (!Array.isArray(opts.entry)) {
            opts.entry = [ opts.entry ];
        }
        var entryBody = fs.readFileSync(
            __dirname + '/wrappers/entry.js', 'utf8'
        );
        
        opts.entry.forEach(function (entry) {
            watchFile(entry, opts);
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
        var name = file.replace(/\.js$/, '');
        
        return wrapperBody
            .replace(/\$__dirname/g, function () {
                return JSON.stringify(path.dirname(file));
            })
            .replace(/\$__filename/g, function () {
                return JSON.stringify(name);
            })
            .replace('$body', function () {
                return src
                    + '\nrequire.modules['
                    + JSON.stringify(name)
                    + '].builtin = true;\n'
                ;
            })
        ;
    })
    .join('\n')
;
