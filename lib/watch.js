var fs = require('fs');
var path = require('path');
var exists = fs.exists || path.exists;

module.exports = function (w, opts) { 
    if (!w.watches) w.watches = [];
    w.register(reg.bind(null, w, opts));
};

function reg (w, opts, body, file) {
    // if already being watched
    if (w.watches[file]) return body;
    
    var type = w.files[file] ? 'files' : 'entries';
    
    var watch = function () {
        if (w.files[file] && w.files[file].synthetic) return;
        
        if (typeof opts === 'object') {
            w.watches[file] = fs.watch(file, opts, watcher);
        }
        else {
            w.watches[file] = fs.watch(file, watcher);
        }
    };
    var pending = null;
    var bundle = function () {
        if (pending) return;
        pending = setTimeout(function () {
            pending = null;
            // modified
            if (w[type][file]) {
                w.reload(file);
            }
            else if (type === 'entries') {
                w.addEntry(file);
            }
            else if (type === 'files') {
                w.require(file);
            }
            
            w._cache = null;
            w.emit('bundle');
        }, 100);
    };
    
    var watcher = function (event, filename) {
        exists(file, function (ex) {
            if (!ex) {
                // deleted
                if (w.files[file]) {
                    delete w.files[file];
                }
                else if (w.entries[file] !== undefined) {
                    w.appends.splice(w.entries[file], 1);
                }
                
                w._cache = null;
            }
            else if (event === 'change') {
                bundle();
            }
            else if (event === 'rename') {
                w.watches[file].close();
                process.nextTick(watch);
                bundle();
            }
        });
    };
    
    w.watches[file] = true;
    process.nextTick(watch);
    
    return body;
}
