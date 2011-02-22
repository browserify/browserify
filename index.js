var fs = require('fs');
var path = require('path');
var EventEmitter = require('events').EventEmitter;

var coffee = require('coffee-script');
var source = require('source');

exports = module.exports = function (opts) {
    var modified = new Date();
    var src = exports.bundle(opts);
    if (!opts.mount) opts.mount = '/browserify.js';
    
    return function (req, res, next) {
        if (req.url.split('?')[0] === opts.mount) {
            res.writeHead(200, {
                'Last-Modified' : modified.toString(),
                'Content-Type' : 'text/javascript',
            });
            res.end(src);
        }
        else next();
    };
};

exports.bundle = function (opts) {
    if (typeof opts === 'string') {
        opts = { base : opts };
        var opts_ = arguments[1];
        if (typeof opts_ === 'object') {
            Object.keys(opts_).forEach(function (key) {
                opts[key] = opts_[key];
            });
        }
    }
    
    var shim = 'shim' in opts ? opts.shim : true;
    var req = opts.require || [];
    if (!Array.isArray(req)) req = [req];
    
    return fs.readFileSync(__dirname + '/wrappers/prelude.js', 'utf8')
        + fs.readFileSync(__dirname + '/wrappers/node_compat.js', 'utf8')
        + (shim ? source.modules('es5-shim')['es5-shim'] : '')
        + wrapperBody
            .replace('$body',
                fs.readFileSync(__dirname + '/builtins/events.js', 'utf8')
            )
            .replace(/\$filename/g, '"events"')
        + (req.length ? exports.wrap(req).source : '')
        + (opts.base ? exports.wrapDir(opts.base) : '')
    ;
};

var wrapperBody = fs.readFileSync(__dirname + '/wrappers/body.js', 'utf8');

exports.wrap = function (libname, opts) {
    if (!opts) opts = {};
    
    if (Array.isArray(libname)) {
        var reqs = opts.required || [];
        
        var src = libname.map(function (name) {
            var lib = exports.wrap(name, { required : reqs });
            reqs.push(name);
            
            var pkg = lib['package.json'];
            if (pkg && pkg.dependencies) {
                var deps = Object.keys(pkg.dependencies);
                var s = exports.wrap(deps, { required : reqs }).source;
                reqs.push.apply(reqs, deps);
                return lib.source + '\n' + s;
            }
            else {
                return lib.source;
            }
        }).join('\n');
        
        return { source : src };
    }
    else if (opts.required && opts.required.indexOf(libname) >= 0) {
        return { source : '' };
    }
    else if (libname.match(/^[.\/]/)) {
        var src = fs.readFileSync(opts.filename || libname, 'utf8');
        var body = (opts.filename || libname).match(/\.coffee$/)
            ? coffee.compile(src) : src
        ;
        
        return {
            source : wrapperBody
                .replace('$body', body)
                .replace(/\$filename/g, JSON.stringify(libname))
            ,
        };
    }
    else {
        var mods = source.modules(libname);
        var pkg = mods[libname + '/package.json'];
        
        return {
            'package.json' : pkg,
            source : Object.keys(mods)
                .filter(function (name) {
                    return !name.match(/\/package\.json$/)
                })
                .map(function (name) {
                    return wrapperBody
                        .replace('$body', mods[name])
                        .replace(/\$filename/g, JSON.stringify(name))
                    ;
                })
                .join('\n')
            ,
        };
    }
};

var find = require('findit');
exports.wrapDir = function (base) {
    if (Array.isArray(base)) {
        return base.map(exports.wrapDir).join('\n');
    }
    else {
        return find.sync(base)
            .filter(function (file) {
                return file.match(/\.(?:js|coffee)$/)
            })
            .map(function (file) {
                return exports.wrap(
                    '.' + file.slice(base.length)
                        .replace(/\.(?:js|coffee)$/,'')
                    , { filename : file }
                ).source;
            })
            .join('\n')
        ;
    }
};
