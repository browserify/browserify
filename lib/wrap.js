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
    
    this.prepends = [];
    this.appends = []
    
    this.require(startFiles || []);
}

Wrap.prototype.prepend = function (src) {
    this.prepends.unshift(src);
};

Wrap.prototype.append = function (src) {
    this.appends.push(src);
};

Wrap.prototype.bundle = function (root) {
    var files = this.files;
    var coredir = path.resolve(__dirname, '../builtins');
    
    return []
        .concat(this.prepends)
        .concat(Object.keys(files).map(function (file) {
            if (file.slice(0, root.length + 1) === root + '/') {
                var mfile = './' + file.slice(root.length + 1);
            }
            else if (file.match(/\/node_modules\/.+/)) {
                var mfile = './node_modules/'
                    + file.match(/\/node_modules\/(.+)/)[1]
                ;
            }
            else if (path.dirname(file) === coredir) {
                var mfile = path.basename(file);
            }
            else {
                throw new Error('Can only load non-root modules'
                    + ' in a node_modules for file: ' + file
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
                    return files[file].toString().replace(/^#![^\n]*\n/, '');
                })
            ;
        }))
        .concat(this.appends)
        .join('\n')
    ;
};

Wrap.prototype.require = function (startFiles) {
    var files = this.files;
    
    if (!Array.isArray(startFiles)) startFiles = [ startFiles ];
    
    startFiles.forEach(function (file) {
        walker(path.resolve(__dirname, file), __dirname);
    });
    
    return this;
    
    function walker (mfile, basedir) {
        if (resolve.isCore(mfile)) {
            var file = path.resolve(__dirname, '../builtins/' + mfile + '.js');
            if (!path.existsSync(file)) {
                throw new Error('No wrapper for core module ' + mfile);
            }
        }
        else {
            try {
                var file = resolve.sync(mfile, { basedir : basedir });
                basedir = path.dirname(file);
            }
            catch (err) {
                throw new Error('Cannot find module ' + JSON.stringify(mfile)
                    + ' from directory ' + JSON.stringify(basedir)
                );
            }
        }
        
        if (files[file]) return;
        
        var body = fs.readFileSync(file);
        files[file] = body;
        
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
        
        keys.forEach(function (f) { walker(f, basedir) });
    }
};
