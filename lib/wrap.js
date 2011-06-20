var detective = require('detective');
var resolve = require('resolve');

var fs = require('fs');
var path = require('path');

var wrappers = require('./wrappers');

module.exports = Wrap;
function Wrap (startFiles, ignore) {
    if (!(this instanceof Wrap)) return new Wrap(startFiles, ignore);
    
    this.files = {};
    this.hashes = {};
    this.aliases = {};
    
    if (!ignore) ignore = [];
    if (!Array.isArray(ignore)) ignore = [ ignore ];
    
    this.ignoring = ignore.reduce(function (acc,x) {
        acc[x] = true;
        return acc;
    }, {});
    
    this.prepends = [ wrappers.prelude, wrappers.process ];
    this.appends = []
    
    this.require(startFiles || []);
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

Wrap.prototype.addEntry = function (file) {
    var body = fs.readFileSync(file, 'utf8').replace(/^#![^\n]*\n/, '');
    
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
    var files = this.files;
    
    return []
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
};

Wrap.prototype.require = function (startFiles) {
    var files = this.files;
    var ignoring = this.ignoring;
    
    var checkedPackages = {};
    
    if (!startFiles) startFiles = []
    else if (!Array.isArray(startFiles)) {
        startFiles = [ startFiles ];
    }
    
    startFiles.forEach(function (file) {
        var dir = process.cwd();
        
        if (typeof file === 'object') {
            Object.keys(file).forEach(function (key) {
                walker(file[key], dir, dir, key);
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
        
        walker(res, dir, dir);
    });
    
    return this;
    
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
                var file = resolve.sync(mfile, { basedir : basedir });
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
        
        var body = fs.readFileSync(file);
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
