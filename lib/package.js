var fs = require('fs');
var path = require('path');
var vm = require('vm');
var coffee = require('coffee-script');

var semver = require('semver');
var findit = require('findit');
var Hash = require('hashish');

var watchFile = require('./watch');

var wrappers = {
    body : fs.readFileSync(__dirname + '/../wrappers/body.js', 'utf8'),
    package : fs.readFileSync(__dirname + '/../wrappers/package.js', 'utf8'),
};

function normalizePkg (pkg, dir, opts) {
    var p = Hash.merge(pkg, opts || {});
    p._original = pkg;
    
    if (!p.name) p.name = path.basename(dir);
    
    if (!p.directories) p.directories = {};
    
    p.directories.test = p.directories.test
        || p.directories.tests
        || [ 'test', 'tests' ]
    ;
    
    p.directories.example = p.directories.example
        || p.directories.examples
        || [ 'example', 'examples' ]
    ;
    
    p.directories.bin = p.directories.bin || [ 'bin' ];
    
    Object.keys(p.directories).forEach(function (name) {
        if (!Array.isArray(p.directories[name])) {
            p.directories[name] = [ p.directories[name] ];
        }
        p.directories[name] = p.directories[name].map(function (d) {
            return path.resolve(dir, d);
        });
    });
    
    if (!p.dependencies) p.dependencies = {};
    if (!p.devDependencies) p.devDependencies = {};
    
    if (p.browserify) {
        p.dependencies = p.browserify.dependencies || {};
        var req = p.browserify.require;
        if (typeof p.browserify === 'string') {
            p.main = p.browserify;
            p.browserify = { base : p.browserify };
        }
        else if (req) {
            if (typeof req === 'string') {
                p.dependencies[req] = '*';
            }
            else if (Array.isArray(req)) {
                req.forEach(function (key) {
                    p.dependencies[key] = '*';
                });
            }
            else if (typeof req === 'object') {
                // unsure how to make dependency maps work yet
                p.require = req;
            }
        }
    }
    
    if (!p.browserify) p.browserify = {};
    if (p.browserify.main) p.main = p.browserify.main;
    
    return p;
}

var Package = module.exports = function (pkgname, basedir, topPkg, opts) {
    if (!opts) opts = {};
    
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
    
    if (!fs.statSync(basedir).isDirectory()) {
        var body = fs.readFileSync(basedir, 'utf8');
        return {
            name : pkgname,
            dependencies : { has : {}, needs : {} },
            toString : function () {
                return wrappers.body
                    .replace(/\$__filename/g, function () {
                        return JSON.stringify(pkgname)
                    })
                    .replace(/\$__dirname/g, function () {
                        return JSON.stringify(pkgname)
                    })
                    .replace('$body', function () {
                        return body.replace(/^#![^\n]*\n/, '');
                    })
            },
        };
    }
    
    if (!topPkg) {
        var body = path.existsSync(basedir + '/package.json')
            ? fs.readFileSync(basedir + '/package.json', 'utf8')
            : '{}'
        ;
        
        var pkg = {};
        try {
            pkg = JSON.parse(body);
        }
        catch (err) {
            if (opts && opts.listen) {
                opts.listen.emit('syntaxError', basedir + '/package.json');
            }
        }
        
        topPkg = normalizePkg(pkg, basedir, opts || {});
    }
    
    var extensions = [ '.js', '.coffee' ];
    
    var files = findit.sync(basedir)
        .filter(function (file) {
            return file.split('/').every(function (p) {
                return !p.match(/^\.[^.]/)
            })
        })
        .filter(function (file) {
            return Hash.valuesAt(topPkg.directories, [ 'bin', 'test', 'example' ])
                .every(function (ds) {
                    return ds.every(function (d) {
                        return file.indexOf(d + '/') !== 0;
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
            try {
                acc[file] = normalizePkg(JSON.parse(body), path.dirname(file));
            }
            catch (err) {
                if (opts && opts.listen) {
                    opts.listen.emit('syntaxError', basedir + '/package.json');
                }
            }
            return acc;
        }, {})
    ;
    pkgFiles[basedir + '/package.json'] = topPkg;
    
    var packageFileFor = function (file) {
        file = path.normalize(file);
        
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
            var dirs = Hash.valuesAt(
                pkg.directories,
                [ 'bin', 'test', 'example' ]
            );
            
            // inside of a directory to ignore
            var inIgnoreDir = dirs.some(function (ds) {
                return ds.some(function (d) {
                    return file.indexOf(d + '/') === 0;
                })
            });
            if (inIgnoreDir) return false;
            
            var base = topPkg.browserify.base || opts.base;
            var inBase = false;
            
            if (typeof base === 'string') {
                inBase = file.indexOf(
                    path.resolve(basedir, base)
                    + (base.match(/\.[^\/.]+$/) ? '' : '/')
                ) === 0
            }
            else if (Array.isArray(base)) {
                inBase = base.some(function (dir) {
                    return file.indexOf(
                        path.resolve(basedir, dir)
                        + (dir.match(/\.[^\/.]+$/) ? '' : '/')
                    ) === 0
                });
            }
            else if (typeof base === 'object') {
                // warning: bugginess follows...
                inBase = Object.keys(base).some(function (name) {
                    var dir = base[name];
                    return file.indexOf(
                        path.resolve(basedir, dir)
                        + (dir.match(/\.[^\/.]+$/) ? '' : '/')
                    ) === 0
                });
            }
            
            if (file.indexOf(basedir + '/node_modules/') === 0) {
                // load the parent package if present
                var ppkg = packageFor(
                    file.slice(0, file.lastIndexOf('node_modules'))
                );
                
                // don't include devDependencies
                var inDev = Object.keys(ppkg.devDependencies).some(function (d) {
                    // could mention a dep twice
                    return file.indexOf(
                        basedir + '/node_modules/' + d + '/'
                    ) === 0 && !ppkg.dependencies[d];
                });
                if (inDev) return false;
                
                var orig = ppkg._original;
                
                var hasDeps = orig.dependencies
                    || (orig.browserify && (
                        orig.browserify.dependencies
                        || orig.browserify.require
                    ))
                ;
                
                if ((!inBase || hasDeps) && ppkg.dependencies) {
                    var inUnmentionedDep = !Object.keys(ppkg.dependencies)
                        .some(function (d) {
                            return file.indexOf(
                                basedir + '/node_modules/' + d + '/'
                            ) === 0
                        })
                    ;
                    if (inUnmentionedDep) return false;
                }
            }
            else if (base) {
                return inBase;
            }
            
            return true;
        })
        .reduce(function (acc, file) {
            var body = fs.readFileSync(file, 'utf8');
            if (path.extname(file) === '.coffee') {
                body = coffee.compile(body);
            }
            
            try {
                vm.runInNewContext(body.replace(/^#![^\n]*\n/, ''), {}, file);
            }
            catch (err) {
                if (err.constructor.name === 'SyntaxError') {
                    // replace syntax errors with an informative inline error
                    body = 'var err = Object.create(SyntaxError.prototype);\n'
                        + Object.keys(err).map(function (key) {
                            return'err[' + JSON.stringify(key) + '] = '
                                + JSON.stringify(err[key]) + ';'
                            ;
                        }).join('\n')
                        + '\nthrow err;'
                    ;
                }
            }
            acc[file] = body;
            
            return acc;
        }, {})
    ;
    
    pkgFiles = Hash.filter(pkgFiles, function (_, pkgfile) {
        var dir = path.dirname(pkgfile);
        return Object.keys(srcFiles).some(function (file) {
            return file.indexOf(dir) === 0;
        });
    });
    
    var self = {
        name : pkgname,
        basedir : basedir,
        dependencies : {
            has : {},
            needs : {}
        },
    };
    
    Object.keys(srcFiles).forEach(function (file) {
        if (opts.watch) watchFile(file, opts);
    });
    
    Hash(pkgFiles).forEach(function (pkg, file) {
        var dir = path.dirname(file);
        if (opts.watch) watchFile(file, opts);
        
        Hash(pkg.dependencies).forEach(function (pat, name) {
            var needed = true;
            
            var ps = dir.slice(basedir.length + 1).split('/');
            for (var i = ps.length; i >= 0; i--) {
                var pkgFile = (basedir + '/' + ps.slice(0,i).join('/')
                    +  '/node_modules/' + name + '/package.json'
                ).replace(/\/+/g, '/');
                
                var pkg = pkgFiles[pkgFile];
                if (pkg || srcFiles[basedir + '/node_modules/index.js']) {
                    if (!pkg) pkg = { version : '0.0.0' };
                    
                    if (!self.dependencies.has[name]) {
                        self.dependencies.has[name] = [];
                    }
                    self.dependencies.has[name].push(pkg.version);
                    
                    if (semver.satisfies(pkg.version, semver.clean(pat))) {
                        needed = false;
                        break;
                    }
                    else throw new Error(
                        'Package in node_modules doesn\'t'
                        + ' match version pattern: '
                        + JSON.stringify(pkg.version)
                        + ' does not satisfy '
                        + JSON.stringify(pat)
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

Package.merge = function (packages) {
    var deps = { has : {}, needs : {} };
    packages.forEach(function (pkg) {
        Object.keys(pkg.dependencies.needs).forEach(function (dep) {
            deps.needs[dep] = (deps.needs[dep] || [])
                .concat(pkg.dependencies.needs)
            ;
        });
    });
    return {
        dependencies : deps,
        toString : function () {
            return packages.map(function (pkg) {
                return pkg.toString();
            }).join('\n') + '\n';
        },
    };
};
