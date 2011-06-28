var path = require('path');

module.exports = function (basedir, relfiles) {
    if (relfiles) {
        var files = relfiles.map(function (r) {
            return path.resolve(basedir, r);
        });
    }
    else {
        var files = basedir;
    }
    
    return files.slice(1).reduce(function (ps, file) {
        if (!file.match(/^\//)) {
            throw new Error('relative path without a basedir');
        }
        
        var xs = file.split(/\/+/);
        for (
            var i = 0;
            ps[i] === xs[i] && i < Math.min(ps.length, xs.length);
            i++
        );
        return ps.slice(0,i);
    }, files[0].split(/\/+/)).join('/');
};
