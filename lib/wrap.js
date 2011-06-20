var detective = require('detective');
var resolve = require('resolve');

var fs = require('fs');
var path = require('path');

var wrappers = require('./wrappers');

module.exports = Wrap;
function Wrap () {
    if (!(this instanceof Wrap)) return new Wrap();
    
    this.files = {};
    this.filters = [];
    this.postFilters = [];
    
    this.ignoring = {};
    this.extensions = [ '.js' ];
    
    this.prepends = [ wrappers.prelude, wrappers.process ];
    this.appends = []
    
    this.require([ 'path' ]);
}

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

Wrap.prototype.use = function (ext, fn) {
    if (ext === 'post') {
        this.postFilters.push(fn);
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

Wrap.prototype.addEntry = function (file) {
    var body = this.readFile(file);
    
    var required = detective.find(body);
    
    if (required.expressions.length) {
        console.error('Expressions in require() statements:');
        required.expressions.forEach(function (ex) {
            console.error('    require(' + ex + ')');
        });
    }
    
    var dir = path.dirname(path.resolve(process.cwd(), file));
    
    this.require(required.strings.map(function (r) {
        return path.resolve(dir, r);
    }));
    
    this.append(wrappers.entry
        .replace(/\$__filename/g, function () {
            return JSON.stringify('/' + dir)
        })
        .replace(/\$__dirname/g, function () {
            return JSON.stringify('/')
        })
        .replace(/\$body/, function () {
            return body
        })
    );
    
    return this;
};

Wrap.prototype.bundle = function () {
    var self = this;
    var files = self.files;
    
    for (var i = 0; i < self.prepends.length; i++) {
        var p = self.prepends[i];
        if (p === wrappers.prelude) {
            self.prepends[i] = p.replace(/\$extensions/, function () {
                return JSON.stringify(self.extensions);
            });
            break;
        }
    }
    
    var src = []
        .concat(this.prepends)
        .concat(Object.keys(files).map(function (name) {
            var file = files[name];
            var root = file.root;
            
            if (isPrefixOf(root + '/', name)) {
                var mfile = '/' + name.slice(root.length + 1);
            }
            else if (resolve.isCore(name) || !name.match(/^(\.\.?)?\//)) {
                var mfile = name;
            }
            else if (name.match(/\/node_modules\/.+/)) {
                var mfile = name.match(/\/node_modules\/(.+)/)[1];
            }
            else {
                throw new Error('Can only load non-root modules'
                    + ' in a node_modules directory for file: ' + name
                );
            }
            
            return wrappers.body
                .replace(/\$__filename/g, function () {
                    return JSON.stringify(mfile)
                })
                .replace(/\$__dirname/g, function () {
                    return JSON.stringify(path.dirname(mfile))
                })
                .replace(/\$body/, function () {
                    return file.body.toString().replace(/^#![^\n]*\n/, '');
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

Wrap.prototype.require = function (startFiles, withRoot) {
    var self = this;
    var files = self.files;
    var ignoring = self.ignoring;
    
    var checkedPackages = {};
    
    if (!startFiles) startFiles = []
    else if (!Array.isArray(startFiles)) {
        startFiles = [ startFiles ];
    }
    
    startFiles.forEach(function (file) {
        var dir = process.cwd();
        
        if (typeof file === 'object') {
            Object.keys(file).forEach(function (key) {
                walker(file[key], dir, withRoot || dir, key);
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
        
        walker(res, dir, withRoot || dir);
    });
    
    return self;
    
    function walker (mfile, basedir, root, asName) {
        if (ignoring[mfile]) return;
        
        if (resolve.isCore(mfile)) {
            var file = path.resolve(__dirname, '../builtins/' + mfile + '.js');
            var name = mfile;
            if (!path.existsSync(file)) {
                throw new Error('No wrapper for core module ' + mfile);
            }
        }
        else {
            try {
                var file = resolve.sync(mfile, {
                    basedir : basedir,
                    extensions : self.extensions
                });
                var name = asName
                    || (isPrefixOf(root + '/', file) ? file : mfile)
                ;
                basedir = path.dirname(file);
                
                var pkgfile = basedir + '/package.json';
                if (!checkedPackages[pkgfile]) {
                    checkedPackages[pkgfile] = true;
                    if (path.existsSync(pkgfile)) {
                        files[pkgfile] = {
                            root : root,
                            body : 'module.exports = '
                                + fs.readFileSync(pkgfile, 'utf8')
                        };
                    }
                }
            }
            catch (err) {
                throw new Error('Cannot find module ' + JSON.stringify(mfile)
                    + ' from directory ' + JSON.stringify(basedir)
                );
            }
        }
        
        if (files[name]) return;
        
        var body = self.readFile(file);
        
        files[name] = { root : root, body : body };
        
        var required = detective.find(body);
        
        if (required.expressions.length) {
            console.error('Expressions in require() statements:');
            required.expressions.forEach(function (ex) {
                console.error('    require(' + ex + ')');
            });
        }
        
        var keys = Object.keys(
            required.strings.reduce(function (acc, r) {
                acc[r] = true;
                return acc;
            }, {})
        );
        
        keys.forEach(function (f) { walker(f, basedir, root) });
    }
};

function isPrefixOf (x, y) {
    return y.slice(0, x.length) === x;
}
