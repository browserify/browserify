var Script = exports.Script = function NodeScript (code) {
    if (!(this instanceof Script)) return new Script(code);
    this.code = code;
};

Script.prototype.runInNewContext = function (context, name) {
    // not strictly isolated but at least you can pass in a context
    var names = [];
    var values = [];
    Object.keys(context).forEach(function (key) {
        names.push(key);
        values.push(context[key]);
    });
    var fn = Function.apply(null, names.concat('return ' + this.code));
    return fn.apply(fn, values);
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

Object.keys(Script.prototype).forEach(function (name) {
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
    return Object.keys(context).reduce(function (acc, key) {
        acc[key] = context[key];
        return acc;
    }, {});
};
