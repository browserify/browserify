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

    // Chrome seems to depend on `this` pseudo variable being a `window` and
    // throws invalid invocation exception otherwise. If that's a case next
    // line will throw and in `catch` clause window bound timer functions will
    // be exported instead.
    exports.setTimeout(function() {});
} catch (_) {
    exports.setTimeout = setTimeout.bind(window);
    exports.clearTimeout = clearTimeout.bind(window);
    exports.setInterval = setInterval.bind(window);
    exports.clearInterval = clearInterval.bind(window);
}
