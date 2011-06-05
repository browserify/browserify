var fs = require('fs');
var path = require('path');

var semver = require('semver');
var findit = require('findit');
var Hash = require('hashish');

var wrappers = {
    body : fs.readFileSync(__dirname + '/../wrappers/body.js', 'utf8'),
    package : fs.readFileSync(__dirname + '/../wrappers/package.js', 'utf8'),
};

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
            ? JSON.parse(fs.readFileSync(basedir + '/package.json', 'utf8'))
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
            acc[file] = normalizePkg(JSON.parse(body), path.dirname(file));
            return acc;
        }, {})
    ;
    pkgFiles[basedir + '/package.json'] = topPkg;
    
    var packageFileFor = function (file) {
        if (file.indexOf(basedir) !== 0) {
            throw new Error('file not rooted at basedir');
        }
        
        var ps = path.dirname(file).slice(basedir.length + 1).split('/');
        
        for (var i = ps.length; i > 0; i--) {
            var dir = basedir + '/' + ps.slice(0,i).join('/');
            var pkgFile = dir + '/package.json';
            if (pkgFiles[pkgFile]) return pkgFile;
        }
        
        return basedir + '/package.json';
    };
    
    var packageFor = function (file) {
        return pkgFiles[packageFileFor(file)];
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
        .reduce(function (acc, file) {
            acc[file] = fs.readFileSync(file, 'utf8');
            return acc;
        }, {})
    ;
    
    var self = {
        name : pkgname,
        dependencies : {
            has : [],
            needs : []
        },
    };
    
    Hash(pkgFiles).forEach(function (pkg, file) {
        var dir = path.dirname(file);
        
        Hash(pkg.dependencies).forEach(function (pat, name) {
            var needed = true;
            
            var ps = dir.slice(basedir.length + 1).split('/');
            for (var i = ps.length; i >= 0; i--) {
                var pkgFile = (basedir + '/' + ps.slice(0,i).join('/')
                    +  '/node_modules/' + name + '/package.json'
                ).replace(/\/+/g, '/');
                
                var pkg = pkgFiles[pkgFile];
                if (pkg) {
                    if (!self.dependencies.has[name]) {
                        self.dependencies.has[name] = [];
                    }
                    self.dependencies.has[name].push(pkg.version);
                    
                    if (semver.satisfies(pkg.version, pat)) {
                        needed = false;
                        break;
                    }
                    else throw new Error(
                        'Package in node_modules doesn\'t'
                        + ' match version pattern'
                    );
                }
            }
            
            if (needed) {
                if (!self.dependencies.needs[name]) {
                    self.dependencies.needs[name] = [];
                }
                self.dependencies.needs[name].push(pat);
            }
        });
    });
    
    self.toString = function () {
        var src = [];
        
        Hash(srcFiles).forEach(function (body, file) {
            if (file.indexOf(basedir) !== 0) {
                throw new Error('FILE Y U NO RELATIVE TO BASEDIR?');
            }
            
            var filename = pkgname + '/' + file.slice(basedir.length + 1);
            var dirname = path.dirname(filename);
            
            src.push(wrappers.body
                .replace(/\$__filename/g, function () {
                    return JSON.stringify(filename)
                })
                .replace(/\$__dirname/g, function () {
                    return JSON.stringify(dirname)
                })
                .replace('$body', function () {
                    return body.replace(/^#![^\n]*\n/, '');
                })
            );
        });
        
        Hash(pkgFiles).forEach(function (pkg, file) {
            if (file.indexOf(basedir) !== 0) {
                throw new Error('FILE Y U NO RELATIVE TO BASEDIR?');
            }
            
            var filename = pkgname + '/' + file.slice(basedir.length + 1);
            
            src.push(wrappers.package
                .replace(/\$__filename/g, function () {
                    return JSON.stringify(filename);
                })
                .replace('$body', function () {
                    return JSON.stringify({
                        name : pkg.name,
                        version : pkg.version,
                        main : pkg.main
                    });
                })
            );
        });
        
        return src.join('\n');
    };
    
    return self;
};
