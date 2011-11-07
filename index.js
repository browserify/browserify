var wrap = require('./lib/wrap');
var mount = require('./lib/mount');
var fs = require('fs');
var crypto = require('crypto');
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
    var w = wrap()
        .register('.coffee', function (body) {
            return coffee.compile(body)
        })
    ;
    
    if (opts.watch) {
        w.register(function (body, file) {
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
                else if (curr.mtime !== prev.mtime) {
                    // modified
                    fs.unwatchFile(file);
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
        
        //Populate the _cache even if we aren't getting the bundle on this request
        if (!_cache) self.bundle();
        
        //Make mount point available to other middleware and views
        req.browserifyMount = mount.create(opts.mount || '/browserify.js', self.digest);
        if(typeof res.local === "function")
            res.local('browserifyMount', req.browserifyMount);
        
        if (mount.equals(req.url, req.browserifyMount)) {
            res.setHeader('Last-Modified', self.modified.toUTCString());
            res.setHeader('Content-Type', 'text/javascript');
            /* Date header not needed, but included in case browsers get mad about long Expire dates?
            What's an extra couple bytes anyway?  Besides, it's being cached, so it's very minimal
            overhead... go with it. */
            res.setHeader('Date', new Date().toUTCString() );

            var d = new Date();
            d.setFullYear(d.getFullYear() + 1);
            res.setHeader('Expires', d.toUTCString() );
            res.setHeader('Cache-Control', 'public, max-age=0'); //31536000 = 365 days * 24 * 60 * 60
            
            if(new Date(req.headers["if-modified-since"]).toUTCString() == self.modified.toUTCString() ||
               req.headers["if-none-match"] === self.digest) {
                res.statusCode = 304;
                res.end();
            }
            else {
                res.setHeader('ETag', '"' + self.digest + '"');
                res.statusCode = 200;
                res.end(_cache);
            }
        }
        else next()
    };
    
    Object.keys(w).forEach(function (key) {
        Object.defineProperty(self, key, {
            set : function (value) { w[key] = value },
            get : function () { return w[key] }
        });
    });
    
    Object.keys(wrap.prototype).forEach(function (key) {
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
        
        self.digest = crypto.createHash('md5').update(src).digest("hex");
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
