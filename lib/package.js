var fs = require('fs');
var path = require('path');
var findit = require('findit');
var Hash = require('hashish');

function normalizePkg (pkg, dir) {
    var p = Hash.copy(pkg);
    if (!p.name) p.name = path.basename(dir);
    
    if (!p.directories) p.directories = {};
    
    p.directories.test = p.directories.test
        || p.directories.tests
        || [ 'test', 'tests' ]
    ;
    
    if (!Array.isArray(p.directories.test)) {
        p.directories.test = [ p.directories.test ];
    }
    
    p.directories.example = p.directories.example
        || p.directories.examples
        || [ 'example', 'examples' ]
    ;
    
    if (!Array.isArray(p.directories.example)) {
        p.directories.example = [ p.directories.example ];
    }
    
    p.directories = Object.keys(p.directories).reduce(function (acc, key) {
        acc[key] = p.directories[key].map(function (d) {
            return path.resolve(dir, d);
        });
        return acc;
    }, {});
    
    if (!p.dependencies) p.dependencies = {};
    
    return p;
}

module.exports = function (name, dir) {
    if (!dir) {
        try {
            dir = path.dirname(require.resolve(name + '/package.json'));
        }
        catch (err) {
            dir = path.dirname(require.resolve(name));
        }
    }
    if (!dir.match(/^\//)) throw new Error('directory must be absolute');
    
    var pkg = normalizePkg(
        path.existsSync(dir + '/package.json')
            ? fs.readFileSync(dir + '/package.json')
            : {}
        ,
        dir
    );
    
    var files = findit.sync(dir)
        .filter(function (file) {
            return file.split('/').every(function (p) {
                return !p.match(/^\.[^.]/)
            })
        })
        .filter(function (file) {
            return Hash.valuesAt(pkg.directories, [ 'test', 'example' ])
                .every(function (ds) {
                    return ds.every(function (d) {
                        return file.indexOf(d) !== 0;
                    })
                })
            ;
        })
    ;
    
    var self = {};
    
    self.toString = function () {
    };
    
    return self;
};
