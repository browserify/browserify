try {
    require('./skip.js');
}
catch (err) {
    t.equal(err.message, "Cannot find module './skip.js'");
}
