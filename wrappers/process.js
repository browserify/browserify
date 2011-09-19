if (typeof process === 'undefined') process = {};

if (!process.nextTick) process.nextTick = (function () {
    var queue = [];
    var dirty = false;
    var fn;
    var hasPostMessage = !!window.postMessage;
    var messageName = 'nexttick';
    var trigger = (function () {
        return hasPostMessage
            ? function trigger () {
                window.postMessage(messageName, '*');
              }
            : function trigger () {
                setTimeout(function () { processQueue() }, 0);
              };
    }());
    var processQueue = (function () {
        return hasPostMessage
            ? function processQueue (event) {
                  if (event.source === window && event.data === messageName) {
                      event.stopPropagation();
                      flushQueue();
                  }
              }
            : flushQueue;
    })();
    function flushQueue () {
        while (fn = queue.shift()) {
            fn();
        }
        dirty = false;
    }    
    function nextTick (fn) {
        queue.push(fn);
        if (dirty) return;
        dirty = true;
        trigger();
    }

    if (hasPostMessage) window.addEventListener('message', processQueue, true);

    nextTick.removeListener = function () {
        window.removeEventListener('message', processQueue, true);
    }

    return nextTick;
})();

if (!process.title) process.title = 'browser';

if (!process.binding) process.binding = function (name) {
    if (name === 'evals') return require('vm')
    else throw new Error('No such module')
};

if (!process.cwd) process.cwd = function () { return '.' };
