if (typeof process === 'undefined') process = {
    nextTick : function (fn) {
        setTimeout(fn, 0);
    },
    title : 'browser'
};
