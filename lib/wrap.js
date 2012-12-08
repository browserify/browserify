var fs = require('fs');
var path = require('path');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var detective = require('detective');
var deputy = require('deputy');
var resolve = require('resolve');

var wrappers = require('./wrappers');
var commondir = require('commondir');
var nub = require('nub');
var checkSyntax = require('syntax-error');

var existsSync = fs.existsSync || path.existsSync;

module.exports = function (opts) {
    return new Wrap(opts);
};
function idFromPath (path) {
    return path.replace(/\\/g, '/');
}
 
function Wrap (opts) {
    var home = process.env.HOME || process.env.USERPROFILE;
    if (opts.cache === undefined && home !== undefined) {
        opts.cache = true;
    }
    
    if (opts.cache) {
        if (typeof opts.cache === 'boolean') {
            var file = home + '/.config/browserify/cache.json';
            this.detective = deputy(file);
        }
        else {
            this.detective = deputy(opts.cache);
        }
    }
    else {
        this.detective = detective;
    }
    
    this.exports = opts.exports;
    
    this.files = {};
    this.filters = [];
    this.pathFilters = [];
    this.postFilters = [];
    this.preFilters = [];
    this.aliases = {};
    this._checkedPackages = {};
    this.errors = {};
    
    this.ignoring = {};
    this.extensions = [ '.js' ];
    
    this.prepends = [ wrappers.prelude, wrappers.process ];
    this.appends = []
    this.entries = {};
    this.debug = opts.debug;
    
    this.require('path');
    this.require('__browserify_process');
}

function resolveMod(from, to){
    // not a real directory on the filesystem; just using the path
    // module to get rid of the filename.
    var targetDir = path.dirname(from);
    // not a real filename; just using the path module to deal with
    // relative paths.
    var reqFilename = path.resolve(targetDir, to);
    // get rid of drive letter on Windows; replace it with '/'
    var reqFilenameWithoutDriveLetter = /^[a-zA-Z]:\\/.test(reqFilename) ?
        '/' + reqFilename.substring(3) : reqFilename;

    return reqFilenameWithoutDriveLetter;
}

util.inherits(Wrap, EventEmitter);

Wrap.prototype.prepend = function (src) {
    this.prepends.unshift(src);
    return this;
};

Wrap.prototype.append = function (src) {
    this.appends.push(src);
    return this;
};

Wrap.prototype.ignore = function (files) {
    if (!files) files = [];
    if (!Array.isArray(files)) files = [ files ];
    
    this.ignoring = files.reduce(function (acc,x) {
        acc[x] = true;
        return acc;
    }, this.ignoring);
    
    return this;
};

Wrap.prototype.use = function (fn) {
    fn(this, this);
    return this;
};

Wrap.prototype.register = function (ext, fn) {
    if (typeof ext === 'object') {
        fn = ext.wrapper;
        ext = ext.extension;
    }
    
    if (ext === 'post') {
        this.postFilters.push(fn);
    }
    else if (ext === 'pre') {
        this.preFilters.push(fn);
    }
    else if (ext === 'path') {
        this.pathFilters.push(fn);
    }
    else if (fn) {
        this.extensions.push(ext);
        this.filters.push(function (body, file) {
            if (file.slice(-ext.length) === ext) {
                return fn.call(this, body, file);
            }
            else return body;
        });
    }
    else {
        this.filters.push(ext);
    }
    return this;
};

Wrap.prototype.reload = function (file) {
    var self = this;
    delete self.errors[file];
    
    if (self.files[file]) {
        var f = self.files[file];
        f.body = undefined;
        delete self.files[file];
        
        self.require(file, f);
    }
    else if (self.entries[file]) {
        var e = self.entries[file];
        e.body = undefined;
        delete self.entries[file];
        
        self.addEntry(file, e);
    }
    
    return self;
};

Wrap.prototype.readFile = function (file) {
    var self = this;
    
    self.pathFilters.forEach(function (fn) {
        file = fn.call(self, file);
    });
    
    var body = fs.readFileSync(file, 'utf8').replace(/^#![^\n]*\n/, '');
    
    self.filters.forEach(function (fn) {
        body = fn.call(self, body, file);
    });
    
    var err = checkSyntax(body, file); 
    if (err) {
        self.errors[file] = err;
        
        process.nextTick(function () {
            self.emit('syntaxError', err);
        });
        return undefined;
    }
    else {
        delete self.errors[file];
    }
    
    return body;
};

Wrap.prototype.alias = function (to, from) {
    this.aliases[to] = from;
    return this;
};

Wrap.prototype.addEntry = function (file_, opts) {
    var self = this;
    if (!opts) opts = {};
    var file = path.resolve(opts.dirname || process.cwd(), file_);
    
    var entry = this.entries[file] = {};
    // entry must be set before readFile for the watch
    var body = entry.body = opts.body || self.readFile(file);
    if (body === undefined) return self;
    
    if (opts.target) entry.target = opts.target;
    
    try {
        var required = self.detective.find(body);
    }
    catch (err) {
        process.nextTick(function () {
            err.message = 'Error while loading entry file '
                + JSON.stringify(file)
                + ': ' + err.message
            ;
            self.emit('syntaxError', err);
        });
        return self;
    }
    
    var dirname = path.dirname(file);
    
    required.strings.forEach(function (req) {
        var params = {
            dirname : dirname,
            fromFile : file,
        };
        if (opts.target && /^[.\/]/.test(req)) {
            params.target = resolveMod(opts.target, req);
        }
        self.require(req, params);
    });
    
    return this;
};

Wrap.prototype.bundle = function () {
    var self = this;
    
    for (var i = 0; i < self.prepends.length; i++) {
        var p = self.prepends[i];
        if (p === wrappers.prelude) {
            self.prepends[i] = p.replace(/\$extensions/, function () {
                return JSON.stringify(self.extensions);
            });
            break;
        }
    }
    
    this.preFilters.forEach((function (fn) {
        fn.call(this, this);
    }).bind(this));
    
    (function () {
        // hack to set -browserify module targets
        var nm = path.resolve(__dirname, '../node_modules') + '/';
        Object.keys(self.files).forEach(function (file) {
            if (file.slice(0, nm.length) !== nm) return;
            var s = file.slice(nm.length);
            if (!/^[^.\/]+-browserify\//.test(s)) return;
            self.files[file].target = '/node_modules/' + s;
        });
    })();
    
    var basedir = (function () {
        var required = Object.keys(self.files)
            .filter(function (x) {
                return !self.files[x].target;
            })
        ;
        var entries = Object.keys(self.entries)
            .filter(function (x) { return !self.entries[x].target })
        ;
        var files = required.concat(entries)
            .map(function (x) { return path.dirname(x) })
        ;
        if (files.length === 0) return '';
        
        var dir = commondir(files) + '/';
        return path.normalize(dir.replace(/\/node_modules\/$/, '/'));
    })();
    
    var removeLeading = function (s) {
        if (s.slice(0, basedir.length) === basedir) {
            return s.slice(basedir.length - 1);
        }
    };
    
    var src = []
        .concat(this.prepends)
        .concat(Object.keys(self.files).map(function (file) {
            var s = self.files[file];
            var target = s.target || removeLeading(file);
            
            if (self.ignoring[target]) return '';
            
            return self.wrap(idFromPath(target), s.body)
        }))
        .concat(Object.keys(self.aliases).map(function (to) {
            var from = self.aliases[to];
            if (!to.match(/^(\.\.?)?\//)) {
                to = '/node_modules/' + to;
            }
            
            return wrappers.alias
                .replace(/\$from/, function () {
                    return JSON.stringify(from);
                })
                .replace(/\$to/, function () {
                    return JSON.stringify(to);
                })
            ;
        }))
        .concat(Object.keys(self.entries).map(function (file) {
            var s = self.entries[file];
            var target = s.target || removeLeading(file);
            return self.wrapEntry(idFromPath(target), s.body);
        }))
        .concat(this.appends)
        .join('\n')
    ;
    
    if (!self.exports) {
        self.exports = Object.keys(self.entries).length ? [] : [ 'require' ];
    }
    if (self.exports === true) self.exports = [ 'require', 'process' ];
    if (!Array.isArray(self.exports)) self.exports = [ self.exports ];
    
    if (self.exports.indexOf('process') >= 0
    && self.exports.indexOf('require') >= 0) {
        src += 'var process = require("__browserify_process");\n'
    }
    else if (self.exports.indexOf('require') >= 0) {
        // nop
    }
    else if (self.exports.indexOf('process') >= 0) {
        src = 'var process = (function(){'
            + src
            + ';return require("__browserify_process")'
            + '})();\n'
        ;
    }
    else {
        src = '(function(){' + src + '})();\n'
    }
    
    this.postFilters.forEach((function (fn) {
        src = fn.call(this, src);
    }).bind(this));
    
    return src;
};

Wrap.prototype.wrap = function (target, body) {
    var self = this;
    return (self.debug ? wrappers.body_debug : wrappers.body)
        .replace(/\$__filename/g, function () {
            return JSON.stringify(target);
        })
        .replace(/\$body/, function () {
            return self.debug
                ? JSON.stringify(body + '\n//@ sourceURL=' + target)
                : body
            ;
        })
    ;
};

Wrap.prototype.wrapEntry = function (target, body) {
    var self = this;
    return (self.debug ? wrappers.entry_debug : wrappers.entry)
        .replace(/\$__filename/g, function () {
            return JSON.stringify(target)
        })
        .replace(/\$body/, function () {
            return self.debug
                ? JSON.stringify(body + '\n//@ sourceURL=' + target)
                : body
            ;
        })
    ;
};

Wrap.prototype.include = function (file, target, body, root) {
    var synthetic = !file;
    if (!file) file = Math.floor(Math.random() * Math.pow(2,32)).toString(16);
    
    this.files[file] = {
        body : body,
        target : target,
        synthetic : synthetic,
        root : root
    };
    return this;
};

Wrap.prototype.require = function (mfile, opts) {
    var self = this;
    if (!opts) opts = {};
    if (!opts.dirname) opts.dirname = process.cwd();
    
    if (typeof mfile === 'object') {
        throw new Error('require maps no longer supported');
    }
    
    if (self.has(mfile)) return self;
    if (opts.target && self.has(opts.target)) return self;
    
    if (self.ignoring[mfile]) return self;
    if (self.aliases[mfile]) return self;
    
    function moduleError (msg) {
        return new Error(msg + ': ' + JSON.stringify(mfile)
            + ' from directory ' + JSON.stringify(opts.dirname)
            + (opts.fromFile ? ' while processing file ' + opts.fromFile : '')
        );
    }
    
    var pkg = {};
    if (mfile === '__browserify_process' || resolve.isCore(mfile)) {
        opts.file = path.resolve(__dirname, '../builtins/' + mfile + '.js');
        opts.target = opts.target || mfile;
        
        if (!existsSync(opts.file)) {
            try {
                require.resolve(mfile + '-browserify');
                opts.body = 'module.exports = require('
                    + JSON.stringify(mfile + '-browserify')
                + ')';
            }
            catch (err) {
                throw moduleError('No wrapper for core module');
            }
        }
    }
    else if (self.has(mfile)) {
        // package has already been included in some fashion, no need to resolve
        return self;
    }
    else if (opts.body) {
        opts.file = mfile;
    }
    else if (!opts.file) {
        try {
            var normPath
                = path.normalize(path.resolve(mfile)) === path.normalize(mfile)
                ? path.normalize(mfile) : mfile
            ;
            opts.file = self.resolver(normPath, opts.dirname);
        }
        catch (err) {
            throw moduleError('Cannot find module');
        }
    }
    
    if (self.has(opts.file)) return self;
    
    var dirname = path.dirname(opts.file);
    var pkgfile = path.join(dirname, 'package.json');
    
    if (!mfile.match(/^(\.\.?)?\//)) {
        try {
            pkgfile = resolve.sync(path.join(mfile, 'package.json'), {
                basedir : dirname
            });
        }
        catch (err) {}
    }
     
    if (pkgfile && !self._checkedPackages[pkgfile]) {
        self._checkedPackages[pkgfile] = true;
        if (existsSync(pkgfile)) {
            var pkgBody = fs.readFileSync(pkgfile, 'utf8');
            try {
                var npmpkg = JSON.parse(pkgBody);
                if (npmpkg.main !== undefined) {
                    pkg.main = npmpkg.main;
                }
                if (npmpkg.browserify !== undefined) {
                    pkg.browserify = npmpkg.browserify;
                }
            }
            catch (err) {
                // ignore broken package.jsons just like node
            }
            
            self.files[pkgfile] = {
                body : 'module.exports = ' + JSON.stringify(pkg),
            };
        }
    }

    var entry = self.files[opts.file] = {
        target : opts.target
    };
    // entry must be set before readFile for the watch
    var body = entry.body = opts.body || self.readFile(opts.file);
    if (body === undefined) {
        delete self.files[opts.file];
        return self;
    }
    
    try {
        var required = self.detective.find(body);
    }
    catch (err) {
        process.nextTick(function () {
            self.emit('syntaxError', err);
        });
        return self;
    }
    
    if (pkg.browserify && pkg.browserify.require) {
        required.strings = required.strings.concat(
            pkg.browserify.require
        );
    }
    
    nub(required.strings).forEach(function (req) {
        var params = {
            dirname : dirname,
            fromFile : opts.file,
        };
        if (opts.target && /^[.\/]/.test(req)) {
            params.target = idFromPath(resolveMod(opts.target, req));
        }
        self.require(req, params);
    });
    
    return self;
};

function isPrefixOf (x, y) {
    return y.slice(0, x.length) === x;
}

Wrap.prototype.has = function (file) {
    var self = this;
    if (self.files[file]) return true;
    
    var res = Object.keys(self.files).some(function (key) {
        return self.files[key].target === file;
    });
    return res;
};

Wrap.prototype.resolver = function (file, basedir) {
    return resolve.sync(file, {
        basedir : basedir,
        extensions : this.extensions,
        packageFilter : function (pkg) {
            var b = pkg.browserify;
            if (b) {
                if (typeof b === 'string') {
                    pkg.main = b;
                }
                else if (typeof b === 'object' && b.main) {
                    pkg.main = b.main;
                }
            }
            return pkg
        }
    });
}
