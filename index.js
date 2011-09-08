var wrap = require('./lib/wrap');
var fs = require('fs');
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
        throw new Error(
            'Base is no longer a valid option.'
            + 'Pass in file or files to the require option and browserify will'
            + ' look at the require()s recursively to include only the files it'
            + 'needs automatically.'
        );
    }
    
    var watches = [];
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
                    }
                    catch (e) {
                        console.error(e && e.stack || e);
                    }
                }
            };
            
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
                Object.keys(w.files).forEach(function (file) {
                    fs.unwatchFile(file);
                });
            });
        }
        listening = true;
        
		//Populate the _cache even if we aren't getting the bundle on this request
		if (!_cache) self.bundle();
		
		//Make mount point available to other middleware and views
		req.browserifyMount = (opts.mount || '/browserify.js') + '?' + self.modified.getTime();
		if(typeof res.local === "function")
			res.local('browserifyMount', req.browserifyMount);
		
		var url = req.url.split('?');
        if (url[0] === (opts.mount || '/browserify.js')) {
			res.setHeader('Last-Modified', self.modified.toUTCString());
			res.setHeader('Content-Type', 'text/javascript');
			/* Date header not needed, but included in case browsers get mad about long Expire dates?
			What's an extra couple bytes anyway?  Besides, it's being cached, so it's very minimal
			overhead... go with it. */
			res.setHeader('Date', new Date().toUTCString() );
			/* Add Expires header only if the query parameter is set to the last modified date.
			This is important since the server may elect NOT to use "URL fingerprinting" and browsers
			end up caching the file indefinitely. */
			if(url[1] != undefined && url[1] == self.modified.getTime() )
			{
				var d = new Date();
				d.setFullYear(d.getFullYear() + 1);
				res.setHeader('Expires', d.toUTCString() );
				res.setHeader('Cache-Control', 'public, max-age=31536000'); //31536000 = 365 days * 24 * 60 * 60
			}
			
			if(new Date(req.headers["if-modified-since"]).toUTCString() == self.modified.toUTCString() ) {
				res.statusCode = 304;
				res.end();
			}
			else {
				res.statusCode = 200;
				res.end(_cache);
			}
        }
        else next()
    };
    
    Object.keys(w).forEach(function (key) {
        self[key] = w[key];
    });
    
    Object.keys(wrap.prototype).forEach(function (key) {
        self[key] = function () {
            var s = w[key].apply(self, arguments)
            if (s === self) { _cache = null }
            return s;
        };
    });
    
    var firstBundle = true;
    self.modified = new Date;
    
    self.bundle = function () {
        var src = w.bundle.apply(w, arguments);
        
        if (!firstBundle) {
            self.modified = new Date;
        }
        firstBundle = false;
        
        _cache = src;
        return src;
    };
    
    return self;
};

exports.bundle = function (opts) {
    return exports(opts).bundle();
};
