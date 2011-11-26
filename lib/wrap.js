var fs = require('fs');
var path = require('path');
var EventEmitter = require('events').EventEmitter;

var detective = require('detective');
var deputy = require('deputy');
var resolve = require('resolve');

var wrappers = require('./wrappers');
var commondir = require('commondir');
var nub = require('nub');

module.exports = function (opts) {
    return new Wrap(opts);
};
 
function Wrap (opts) {
    if (opts.cache === undefined && process.env.HOME !== undefined) {
        opts.cache = true;
    }
    
    if (opts.cache) {
        if (typeof opts.cache === 'boolean') {
            var file = process.env.HOME + '/.config/browserify/cache.json';
            this.detective = deputy(file);
        }
        else {
            this.detective = deputy(opts.cache);
        }
    }
    else {
        this.detective = detective;
    }
    
    this.files = {};
    this.filters = [];
    this.postFilters = [];
    this.preFilters = [];
    this.aliases = {};
    this._checkedPackages = {};
    
    this.ignoring = {};
    this.extensions = [ '.js' ];
    
    this.prepends = [ wrappers.prelude, wrappers.process ];
    this.appends = []
    this.entries = {};
    
    this.require([ 'path' ]);
}

Wrap.prototype = new EventEmitter;

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
    }, {});
    
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

Wrap.prototype.readFile = function (file) {
    var self = this;
    
    var body = fs.readFileSync(file, 'utf8').replace(/^#![^\n]*\n/, '');
    
    self.filters.forEach(function (fn) {
        body = fn.call(self, body, file);
    });
    
    return body;
};

Wrap.prototype.alias = function (to, from) {
    this.aliases[to] = from;
    return this;
};

Wrap.prototype.addEntry = function (file, opts) {
    var self = this;
    if (!opts) opts = {};
    
    var body = opts.body || self.readFile(file);
    
    try {
        var required = self.detective.find(body);
    }
    catch (err) {
        process.nextTick(function () {
            self.emit('syntaxError', err);
        });
        return self;
    }
    
    if (required.expressions.length) {
        console.error('Expressions in require() statements:');
        required.expressions.forEach(function (ex) {
            console.error('    require(' + ex + ')');
        });
    }
    
    var dir = path.dirname(path.resolve(process.cwd(), file));
    if (!opts.root) {
        opts.root = commondir(dir, required.strings.concat(file));
    }
    file = path.resolve(process.cwd(), file);
    
    required.strings.forEach(function (r) {
        var x = r.match(/^(\.\.?)?\//) ? path.resolve(opts.root, r) : r;
        self.require(x, { root : opts.root });
    });
    
    this.entries[file] = this.appends.length;
    this.append(wrappers.entry
        .replace(/\$__filename/g, function () {
            return JSON.stringify(opts.target || file.slice(dir.length))
        })
        .replace(/\$body/, function () {
            return body
        })
    );
    
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
    
    var src = []
        .concat(this.prepends)
        .concat(Object.keys(self.files).map(function (name) {
            return self.files[name].body;
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
        .concat(this.appends)
        .join('\n')
    ;
    
    this.postFilters.forEach((function (fn) {
        src = fn.call(this, src);
    }).bind(this));
    
    return src;
};

Wrap.prototype.wrap = function (target, body) {
    return wrappers.body
      .replace(/\$__filename/g, function () {
          return JSON.stringify(target);
      })
      .replace(/\$body/, function () {
          return body.toString();
      });
};

Wrap.prototype.include = function (file, target, body, root) {
    var synthetic = !file;
    if (!file) file = Math.floor(Math.random() * Math.pow(2,32)).toString(16);
    
    this.files[file] = {
        body : this.wrap(target, body),
        target : target,
        synthetic : synthetic,
        root : root
    };
    return this;
};

Wrap.prototype.reload = function (name) {
    if (this.files[name] !== undefined) {
        var file = this.files[name];
        delete this.files[name];
        this.require(name, { target : file.target, root : file.root });
    }
    else if (this.entries[name] !== undefined) {
        var items = this.appends.splice(this.entries[name], 1);
        try {
            this.addEntry(name);
        }
        catch (e) {
            // Return item back to list
            this.appends.splice(this.entries[name], 0, items[0]);
            
            // Rethrow error
            throw e;
        }
    }
    return this;
};

function makeTarget (file, root) {
    if (isPrefixOf(root + '/', file)) {
        return path.normalize('/' + file.slice(root.length + 1));
    }
    else if (resolve.isCore(file) || !file.match(/^\//)) {
        return path.normalize(file);
    }
    else if (file.match(/\/node_modules\/.+/)) {
        return path.normalize(file.match(/(\/node_modules\/.+)/)[1]);
    }
    else {
        throw new Error('Can only load non-root modules'
            + ' in a node_modules directory for file: ' + file
        );
    }
}

Wrap.prototype.requireMultiple = function (startFiles) {
    var self = this;
    
    if (!startFiles) startFiles = []
    else if (!Array.isArray(startFiles)) {
        startFiles = [ startFiles ];
    }
    
    startFiles.forEach(function include (file) {
        var dir = process.cwd();
        
        if (typeof file === 'object') {
            Object.keys(file).forEach(function (key) {
                self.alias(key, file[key]);
                include(file[key]);
            });
            return;
        }
        
        if (resolve.isCore(file)) {
            var res = file;
        }
        else if (file.match(/^(\.\.?)?\//)) {
            var res = path.resolve(process.cwd(), file);
            var dir = path.dirname(res);
        }
        else {
            var res = file;
        }
        
        self.require(res, { basedir : dir, root : dir });
    });
    
    return self;
};

Wrap.prototype.require = function (mfile, opts) {
    var self = this;
    if (!opts) opts = {};
    if (!opts.basedir) opts.basedir = process.cwd();
    
    if (typeof mfile === 'object') {
        return self.requireMultiple(mfile, opts);
    }
    
    if (self.ignoring[mfile]) return self;
    if (self.aliases[mfile]) return self;
    
    var pkg = {};
    if (resolve.isCore(mfile)) {
        var file = path.resolve(__dirname, '../builtins/' + mfile + '.js');
        opts.target = opts.target || mfile;
        
        if (!path.existsSync(file)) {
            throw new Error('No wrapper for core module ' + mfile);
        }
    }
    else if (self.has(mfile, '/node_modules/' + mfile + '/index.js')
    || self.has(mfile, '/node_modules/' + mfile + '/package.json')) {
        // package has already been included in some fashion, no need to resolve
        return self;
    }
    else if (opts.body) {
        var file = mfile;
    }
    else {
        try {
            var file = self.resolver(mfile, opts.basedir);
        }
        catch (err) {
            throw new Error('Cannot find module ' + JSON.stringify(mfile)
                + ' from directory ' + JSON.stringify(opts.basedir)
            );
        }
    }
    
    opts.basedir = path.dirname(file);
    
    if (!opts.root && mfile.match(/^\//)) {
        opts.root = opts.basedir;
    }
    
    if (!opts.target) {
        opts.target = makeTarget(file, opts.root);
    }
    if (self.ignoring[opts.target]) return self;
    if (self.has(file, opts.target)) return self;
    
    var pkgfile = opts.basedir + '/package.json';
    if (!mfile.match(/^(\.\.?)?\//)) {
        try {
            pkgfile = resolve.sync(mfile + '/package.json', {
                basedir : opts.basedir
            });
        }
        catch (err) {}
    }
     
    if (pkgfile && !self._checkedPackages[pkgfile]) {
        self._checkedPackages[pkgfile] = true;
        if (path.existsSync(pkgfile)) {
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
            
            self.include(pkgfile, makeTarget(pkgfile, opts.root), 
                'module.exports = ' + JSON.stringify(pkg), opts.root
            );
        }
    }
    
    var body = opts.body || self.readFile(file);
    self.include(file, opts.target, body, opts.root);
    
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
    
    if (required.expressions.length) {
        console.error('Expressions in require() statements:');
        required.expressions.forEach(function (ex) {
            console.error('    require(' + ex + ')');
        });
    }
    
    nub(required.strings).forEach(function (req) {
        self.require(req, { basedir : opts.basedir, root : opts.root })
    });
    
    return self;
};

function isPrefixOf (x, y) {
    return y.slice(0, x.length) === x;
}

Wrap.prototype.has = function (file, target) {
    if (this.files[file]) return true;
    
    var filenames = Object.keys(this.files);
    for (var i = 0; i < filenames.length; i++) {
        var f = this.files[filenames[i]];
        if (f.target === target) return true;
    }
    return false;
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
