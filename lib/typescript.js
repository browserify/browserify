var path = require('path');
var through = require('through2');
var resolve = require('resolve');
var xtend = require('xtend');
var hasOwn = require('hasown');

var extensions = [ '.ts', '.tsx' ];

var compilerCache = {};
var configCache = {};

exports.extensions = extensions;
exports.isTypeScript = isTypeScript;
exports.isDeclaration = isDeclaration;
exports.createTransform = createTransform;

function isTypeScript (file) {
    if (typeof file !== 'string') return false;
    for (var i = 0; i < extensions.length; i++) {
        var ex = extensions[i];
        if (file.length > ex.length && file.slice(-ex.length) === ex) {
            return true;
        }
    }
    return false;
}

function isDeclaration (file) {
    return typeof file === 'string' && /\.d\.ts$/.test(file);
}

// Returns a browserify transform that compiles .ts and .tsx files with the
// typescript compiler. Files with any other extension pass through untouched.
//
// opts:
//   basedir          - where to look for the typescript module and tsconfig.json
//   debug            - emit inline source maps
//   tsconfig         - path to a tsconfig.json, or false to not look for one
//   compilerOptions  - compiler options, as they appear in tsconfig.json
//   compiler         - a typescript module to use instead of requiring one
function createTransform (opts) {
    if (!opts) opts = {};

    return function (file) {
        if (!isTypeScript(file)) return through();

        var chunks = [];
        return through(function (chunk, enc, next) {
            chunks.push(chunk);
            next();
        }, function (next) {
            var source = Buffer.concat(chunks).toString('utf8');
            var output;
            try {
                output = compile(source, file, opts);
            }
            catch (err) {
                return next(err);
            }
            this.push(output);
            next();
        });
    };
}

function compile (source, file, opts) {
    // declaration files carry no code, only types
    if (isDeclaration(file)) return '';

    var ts = loadCompiler(opts);
    var res = ts.transpileModule(source, {
        fileName: file,
        compilerOptions: compilerOptions(ts, file, opts),
        reportDiagnostics: true
    });

    var diagnostics = (res.diagnostics || []).filter(function (d) {
        return d.category === ts.DiagnosticCategory.Error;
    });
    if (diagnostics.length) throw diagnosticError(ts, diagnostics[0], file);

    return res.outputText;
}

function loadCompiler (opts) {
    if (opts.compiler) return opts.compiler;

    var basedir = opts.basedir || process.cwd();
    if (hasOwn(compilerCache, basedir)) return compilerCache[basedir];

    var file;
    try {
        file = resolve.sync('typescript', { basedir: basedir });
    }
    catch (err) {
        try {
            file = require.resolve('typescript');
        }
        catch (err_) {
            throw new Error(
                'Cannot find module \'typescript\' from ' + basedir + '\n'
                + 'browserify compiles .ts and .tsx files with the typescript '
                + 'compiler, which is not installed as a dependency because '
                + 'most bundles do not need it. Install it with:\n\n'
                + '    npm install typescript\n\n'
                + 'or pass --no-typescript to turn off TypeScript support.'
            );
        }
    }
    try {
        compilerCache[basedir] = require(file);
    }
    catch (err) {
        throw new Error(
            'Cannot load the typescript compiler at ' + file + ': '
            + err.message
        );
    }
    return compilerCache[basedir];
}

function compilerOptions (ts, file, opts) {
    var options = xtend(
        readConfig(ts, file, opts),
        convert(ts, opts.compilerOptions, opts.basedir || process.cwd(), null,
            'the typescript compilerOptions')
    );

    // browserify walks require() calls, so the emitted modules have to be
    // commonjs no matter what the surrounding project compiles to
    options.module = ts.ModuleKind.CommonJS;
    if (options.target === undefined) options.target = ts.ScriptTarget.ES5;
    if (options.esModuleInterop === undefined) options.esModuleInterop = true;
    if (options.jsx === undefined && /\.tsx$/.test(file)) {
        options.jsx = ts.JsxEmit.React;
    }

    // one file in, one file out: everything about writing files to disk or
    // type checking across files is the bundler's business, not tsc's
    options.inlineSourceMap = Boolean(opts.debug);
    options.inlineSources = Boolean(opts.debug);
    options.sourceMap = false;
    options.declaration = false;
    options.declarationMap = false;
    options.composite = false;
    options.noEmit = false;
    // these describe how a project resolves and emits whole programs, which
    // says nothing about how to transpile a single file
    delete options.moduleResolution;
    delete options.importsNotUsedAsValues;
    options.verbatimModuleSyntax = false;
    options.emitDeclarationOnly = false;
    delete options.out;
    delete options.outFile;
    delete options.outDir;

    return options;
}

function readConfig (ts, file, opts) {
    if (opts.tsconfig === false) return {};
    if (!ts.sys || !ts.readConfigFile) return {};

    var basedir = opts.basedir || process.cwd();
    var configFile;
    if (typeof opts.tsconfig === 'string') {
        configFile = path.resolve(basedir, opts.tsconfig);
    }
    else {
        var dir = path.dirname(file);
        if (hasOwn(configCache, dir)) return configCache[dir];
        configFile = ts.findConfigFile(dir, ts.sys.fileExists, 'tsconfig.json');
        if (!configFile) {
            configCache[dir] = {};
            return configCache[dir];
        }
        configCache[dir] = parseConfig(ts, configFile);
        return configCache[dir];
    }

    if (hasOwn(configCache, configFile)) return configCache[configFile];
    configCache[configFile] = parseConfig(ts, configFile);
    return configCache[configFile];
}

function parseConfig (ts, configFile) {
    var res = ts.readConfigFile(configFile, ts.sys.readFile);
    if (res.error) throw diagnosticError(ts, res.error, configFile);
    var config = res.config || {};
    return convert(ts, config.compilerOptions, path.dirname(configFile), configFile);
}

function convert (ts, options, basedir, configFile, name) {
    if (!options) return {};
    var res = ts.convertCompilerOptionsFromJson(options, basedir, configFile);
    if (res.errors && res.errors.length) {
        throw diagnosticError(ts, res.errors[0], name || configFile || basedir);
    }
    return res.options || {};
}

function diagnosticError (ts, diagnostic, file) {
    var message = ts.flattenDiagnosticMessageText
        ? ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
        : String(diagnostic.messageText)
    ;
    var name = (diagnostic.file && diagnostic.file.fileName) || file;
    var line, column;
    if (diagnostic.file && typeof diagnostic.start === 'number') {
        var pos = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        line = pos.line + 1;
        column = pos.character + 1;
    }

    var err = new Error(
        message
        + ' (TS' + diagnostic.code + ') while compiling '
        + name + (line === undefined ? '' : ':' + line + ':' + column)
    );
    err.filename = name;
    if (line !== undefined) {
        err.line = line;
        err.column = column;
    }
    return err;
}
