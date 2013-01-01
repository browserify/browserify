try {
    // Old IE browsers that do not curry arguments
    if (!setTimeout.call) {
        var slicer = Array.prototype.slice;
        exports.setTimeout = function(fn) {
            var args = slicer.call(arguments, 1);
            return setTimeout(function() {
                return fn.apply(this, args);
            })
        };

        exports.setInterval = function(fn) {
            var args = slicer.call(arguments, 1);
            return setInterval(function() {
                return fn.apply(this, args);
            });
        };
    } else {
        exports.setTimeout = setTimeout;
        exports.setInterval = setInterval;
    }
    exports.clearTimeout = clearTimeout;
    exports.clearInterval = clearInterval;

    // Chrome and PhantomJS seems to depend on `this` pseudo variable being a
    // `window` and throws invalid invocation exception otherwise. If this code
    // runs in such JS runtime next line will throw and `catch` clause will
    // exported timers functions bound to a window.
    exports.setTimeout(function() {});
} catch (_) {
    function bind(f, context) {
        return function () { return f.apply(context, arguments) };
    }
    
    exports.setTimeout = bind(setTimeout, window);
    exports.setInterval = bind(setInterval, window);
    exports.clearTimeout = bind(clearTimeout, window);
    exports.clearInterval = bind(clearInterval, window);
}
