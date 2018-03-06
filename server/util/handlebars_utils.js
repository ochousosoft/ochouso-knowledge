var Handlebars = require('handlebars');

Handlebars.registerHelper('ifNot', function(data, opts) {
    if (!data) {
        return opts.fn(this);
    } else {
        return opts.inverse(this);
    }
});