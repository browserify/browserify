var Object_keys = function (obj) {
    if (Object.keys) return Object.keys(obj)
    else {
        var res = [];
        for (var key in obj) res.push(key)
        return res;
    }
};

var forEach = function (xs, fn) {
    if (xs.forEach) return xs.forEach(fn)
    else for (var i = 0; i < xs.length; i++) {
        fn(xs[i], i, xs);
    }
};

var Script = exports.Script = function NodeScript (code) {
    if (!(this instanceof Script)) return new Script(code);
    this.code = code;
};

var iframe = document.createElement('iframe');
if (!iframe.style) iframe.style = {};
iframe.style.display = 'none';

var iframeCapable = true; // until proven otherwise
if (navigator.appName === 'Microsoft Internet Explorer') {
    var m = navigator.appVersion.match(/\bMSIE (\d+\.\d+);/);
    if (m && parseFloat(m[1]) <= 9.0) {
        iframeCapable = false;
    }
}

Script.prototype.runInNewContext = function (context) {
    if (!context) context = {};
    
    if (!iframeCapable) {
        var keys = Object_keys(context);
        var args = [];
        for (var i = 0; i < keys.length; i++) {
            args.push(context[keys[i]]);
        }
        
        var fn = new Function(keys, 'return ' + this.code);
        return fn.apply(null, args);
    }
    
    document.body.appendChild(iframe);
    
    var win = iframe.contentWindow
        || (window.frames && window.frames[window.frames.length - 1])
        || window[window.length - 1]
    ;
    
    forEach(Object_keys(context), function (key) {
        win[key] = context[key];
        iframe[key] = context[key];
    });
     
    if (win.eval) {
        // chrome and ff can just .eval()
        var res = win.eval(this.code);
    }
    else {
        // this works in IE9 but not anything newer
        iframe.setAttribute('src',
            'javascript:__browserifyVmResult=(' + this.code + ')'
        );
        if ('__browserifyVmResult' in win) {
            var res = win.__browserifyVmResult;
        }
        else {
            iframeCapable = false;
            res = this.runInThisContext(context);
        }
    }
    
    forEach(Object_keys(win), function (key) {
        context[key] = win[key];
    });
    
    document.body.removeChild(iframe);
    
    return res;
};

Script.prototype.runInThisContext = function () {
    return eval(this.code); // maybe...
};

Script.prototype.runInContext = function (context) {
    // seems to be just runInNewContext on magical context objects which are
    // otherwise indistinguishable from objects except plain old objects
    // for the parameter segfaults node
    return this.runInNewContext(context);
};

forEach(Object_keys(Script.prototype), function (name) {
    exports[name] = Script[name] = function (code) {
        var s = Script(code);
        return s[name].apply(s, [].slice.call(arguments, 1));
    };
});

exports.createScript = function (code) {
    return exports.Script(code);
};

exports.createContext = Script.createContext = function (context) {
    // not really sure what this one does
    // seems to just make a shallow copy
    var copy = {};
    forEach(Object_keys(context), function (key) {
        copy[key] = context[key];
    });
    return copy;
};
