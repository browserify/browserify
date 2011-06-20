var detective = require('detective');
var findit = require('findit');
var resolve = require('resolve');
var Seq = require('seq');

var fs = require('fs');
var path = require('path');

var wrappers = require('./wrappers');

module.exports = Wrap;
function Wrap (startFiles) {
    if (!(this instanceof Wrap)) return new Wrap(startFiles);
    
    this.files = {};
    this.hashes = {};
    this.aliases = {};
    
    this.prepends = [ wrappers.prelude, wrappers.process ];
    this.appends = []
    
    this.require(startFiles || []);
    this.require('path');
}

Wrap.prototype.prepend = function (src) {
    this.prepends.unshift(src);
};

Wrap.prototype.append = function (src) {
    this.appends.push(src);
};

Wrap.prototype.bundle = function () {
    var files = this.files;
    
    return []
        .concat(this.prepends)
        .concat(Object.keys(files).map(function (key) {
            var file = files[key];
            var root = file.root;
            var name = key;
            
            if (isPrefixOf(root + '/', name)) {
                var mfile = './' + name.slice(root.length + 1);
            }
            else if (resolve.isCore(name) || !name.match(/^(\.\.?)?\//)) {
                var mfile = name;
            }
            else if (name.match(/\/node_modules\//)) {
                var mfile = name.match(/\/node_modules\/(.+)/)[1];
console.dir(mfile);
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
    var checkedPackages = {};
    
    if (!Array.isArray(startFiles)) {
        startFiles = [ startFiles ];
    }
    
    startFiles.forEach(function (file) {
        var dir = process.cwd();
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
    
    function walker (mfile, basedir, root) {
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
                var name = isPrefixOf(root + '/', file) ? file : mfile;
                basedir = path.dirname(file);
                
                var pkgfile = basedir + '/package.json';
                if (!checkedPackages[pkgfile]) {
                    checkedPackages[pkgfile] = true;
                    if (path.existsSync(pkgfile)) {
                        files[pkgfile] = {
                            root : root,
                            body : 'return ' + fs.readFileSync(pkgfile, 'utf8')
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
