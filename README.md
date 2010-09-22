Browserify
==========

Turn node modules into browser-compliant javascript.

Example
=======

    var src = Browserify().require('traverse').require('./moo').bundle();

// and then later...
    
    app.get('/bundle.js', function (res, req) {
        res.write(200, { 'Content-Type' : 'text/javascript' });
        res.end(src);
    });

TODO
====

* Include es5 compatability layer for ancient browsers.
* Build a dependency graph for top-level requires.
* Wrap module requires up in lambdas.
