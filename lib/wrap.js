var detective = require('detective');
var findit = require('findit');
var resolve = require('resolve');
var Seq = require('seq');

var fs = require('fs');
var path = require('path');

var exports = module.exports = function (startFiles) {
    var self = {};
    
    self.include = function () {
        exports.walk();
    };
    
    return self;
};

exports.walk = function (startFiles) {
    if (!Array.isArray(startFiles)) startFiles = [ startFiles ];
    
    var bodies = {};
    
    startFiles.forEach(function (file) {
        walker(path.resolve(__dirname, file), __dirname);
    });
    
    return bodies;
    
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
        
        if (bodies[file]) return;
        
        var body = fs.readFileSync(file);
        bodies[file] = body;
        
        var required = detective.find(body);
        
        if (required.expressions.length) {
            console.error('Expressions in require() statements:');
            required.expressions.forEach(function (ex) {
                console.error('    require(' + ex + ')');
            });
        }
        
        var files = Object.keys(
            required.strings.reduce(function (acc, r) {
                acc[r] = true;
                return acc;
            }, {})
        );
        
        files.forEach(function (f) {
            walker(f, basedir);
        });
    }
};
