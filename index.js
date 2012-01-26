var wrap = require('./lib/wrap');
var fs = require('fs');
var coffee = require('coffee-script');
var EventEmitter = require('events').EventEmitter;

var exports = module.exports = function (entryFile, opts) {
    if (typeof entryFile === 'object') {
        opts = entryFile;
        entryFile = null;
    }
    
    if (!opts) opts = {};
    
    if (Array.isArray(entryFile)) {
        if (Array.isArray(opts.entry)) {
            opts.entry.unshift.apply(opts.entry, entryFile);
        }
        else if (opts.entry) {
            opts.entry = entryFile.concat(opts.entry);
        }
        else {
            opts.entry = entryFile;
        }
    }
    else if (typeof entryFile === 'string') {
        if (Array.isArray(opts.entry)) {
            opts.entry.unshift(entryFile);
        }
        else if (opts.entry) {
            opts.entry = [ opts.entry, entryFile ];
        }
        else {
            opts.entry = entryFile;
        }
    }
    
    if (!opts.require) opts.require = [];
    
    if (opts.base) {
        throw new Error(
            'Base is no longer a valid option.'
            + 'Pass in file or files to the require option and browserify will'
            + ' look at the require()s recursively to include only the files it'
            + 'needs automatically.'
        );
    }
    
    var watches = {};
    var w = wrap({ cache : opts.cache, debug : opts.debug })
        .register('.coffee', function (body) {
            return coffee.compile(body)
        })
    ;
    
    if (opts.watch) {
        
        w.register(function (body, file) {
            // if already being watched
            if (watches[file]) return body;
            
            var watcher = function (curr, prev) {
                
                if (curr.nlink === 0) {
                    // deleted
                    if (w.files[file]) {
                        delete w.files[file];
                    }
                    else if (w.entries[file] !== undefined) {
                        w.appends.splice(w.entries[file], 1);
                    }
                    
                    _cache = null;
                }
                else if (curr.mtime.getTime() !== prev.mtime.getTime()) {
                    // modified
                    try {
                        w.reload(file);
                        _cache = null;
                        self.emit('bundle');
                    }
                    catch (e) {
                        self.emit('syntaxError', e);
                        if (self.listeners('syntaxError').length === 0) {
                            console.error(e && e.stack || e);
                        }
                    }
                }
            };
            
            watches[file] = true;
            process.nextTick(function () {
                if (w.files[file] && w.files[file].synthetic) return;
                
                if (typeof opts.watch === 'object') {
                    fs.watchFile(file, opts.watch, watcher);
                }
                else {
                    fs.watchFile(file, watcher);
                }
            });
            
            return body;
        })
    }
    
    if (opts.filter) {
        w.register('post', function (body) {
            return opts.filter(body);
        });
    }
    
    w.ignore(opts.ignore || []);
    w.require(opts.require);
    
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
    
    var _cache = null;
    var listening = false;
    var self = function (req, res, next) {
        if (!listening && req.connection && req.connection.server) {
            req.connection.server.on('close', function () {
                self.end();
            });
        }
        listening = true;
        
        if (req.url.split('?')[0] === (opts.mount || '/browserify.js')) {
            if (!_cache) self.bundle();
            res.statusCode = 200;
            res.setHeader('last-modified', self.modified.toString());
            res.setHeader('content-type', 'text/javascript');
            res.end(_cache);
        }
        else next()
    };
    
    Object.keys(w).forEach(function (key) {
        Object.defineProperty(self, key, {
            set : function (value) { w[key] = value },
            get : function () { return w[key] }
        });
    });
    
    Object.keys(Object.getPrototypeOf(w)).forEach(function (key) {
        self[key] = function () {
            var s = w[key].apply(self, arguments)
            if (s === self) { _cache = null }
            return s;
        };
    });
    
    Object.keys(EventEmitter.prototype).forEach(function (key) {
        self[key] = w[key].bind(w);
    });
    
    var firstBundle = true;
    self.modified = new Date;
    
    var ok = true;
    self.on('bundle', function () {
        ok = true;
    });
    
    self.on('syntaxError', function (err) {
        ok = false;
        if (self.listeners('syntaxError').length <= 1) {
            console.error(err && err.stack || err);
        }
    });
    
    var lastOk = null;
    self.bundle = function () {
        if (!ok && _cache) return _cache;
        if (!ok && lastOk) return lastOk;
        
        var src = w.bundle.apply(w, arguments);
        
        if (!firstBundle) {
            self.modified = new Date;
        }
        firstBundle = false;
        
        _cache = src;
        if (ok) lastOk = src;
        return src;
    };
    
    self.end = function () {
        Object.keys(watches).forEach(function (file) {
            fs.unwatchFile(file);
        });
    };
    
    return self;
};

exports.bundle = function (opts) {
    return exports(opts).bundle();
};
