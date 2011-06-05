var fs = require('fs');
var path = require('path');

var semver = require('semver');
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

var Package = module.exports = function (pkgname, basedir) {
    if (!basedir) {
        try {
            basedir = path.dirname(require.resolve(pkgname + '/package.json'));
        }
        catch (err) {
            basedir = path.dirname(require.resolve(pkgname));
        }
    }
    if (!basedir.match(/^\//)) throw new Error('directory must be absolute');
    basedir = basedir.replace(/\/$/, '');
    
    var topPkg = normalizePkg(
        path.existsSync(basedir + '/package.json')
            ? fs.readFileSync(basedir + '/package.json')
            : {}
        ,
        basedir
    );
    var extensions = [ '.js', '.coffee' ];
    
    var files = findit.sync(basedir)
        .filter(function (file) {
            return file.split('/').every(function (p) {
                return !p.match(/^\.[^.]/)
            })
        })
        .filter(function (file) {
            return Hash.valuesAt(topPkg.directories, [ 'test', 'example' ])
                .every(function (ds) {
                    return ds.every(function (d) {
                        return file.indexOf(d) !== 0;
                    })
                })
            ;
        })
    ;
    
    var pkgFiles = files
        .filter(function (file) {
            return path.basename(file) === 'package.json'
                && path.dirname(file) !== basedir
        })
        .reduce(function (acc, file) {
            var body = fs.readFileSync(file, 'utf8');
            
            if (path.basename(file) === 'package.json') {
                body = normalizePkg(JSON.parse(body), path.dirname(file));
            }
            
            acc[file] = body;
            return acc;
        }, {})
    ;
    pkgFiles[basedir + '/package.json'] = topPkg;
    
    var packageFor = function (file) {
        if (file.indexOf(basedir) !== 0) {
            throw new Error('file not rooted at basedir');
        }
        
        var ps = path.dirname(file).slice(basedir.length + 1).split('/');
        
        for (var i = ps.length; i > 0; i--) {
            var dir = basedir + '/' + ps.slice(0,i).join('/');
            var pkgFile = dir + '/package.json';
            if (pkgFiles[pkgFile]) return pkgFiles[pkgFile];
        }
        
        return topPkg;
    };
    
    var srcFiles = files
        .filter(function (file) {
            var ext = path.extname(file);
            if (extensions.indexOf(ext) < 0) return false;
            
            var pkg = packageFor(file);
            return Hash.valuesAt(pkg.directories, [ 'test', 'example' ])
                .every(function (ds) {
                    return ds.every(function (d) {
                        return file.indexOf(d) !== 0;
                    })
                })
            ;
        })
    ;
console.dir(srcFiles);
    
    var self = { name : pkgname };
    
    self.dependencies = {
        internal : {},
        external : {},
    };
    
    /*
    Hash(pkg.dependencies).forEach(function (version, name) {
        // self.dependencies.external
    });
    */
    
    self.toString = function () {
        
    };
    
    return self;
};
