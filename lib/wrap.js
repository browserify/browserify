var detective = require('detective');
var findit = require('findit');
var resolve = require('resolve');
var Seq = require('seq');

var fs = require('fs');
var path = require('path');

module.exports = Wrap;
function Wrap (startFiles) {
    if (!(this instanceof Wrap)) return new Wrap(startFiles);
    this.files = {};
    this.require(startFiles || []);
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
