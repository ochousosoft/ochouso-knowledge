var mode = require("./mode");

var winston = require('winston');
var logger;

if (mode == 'development') {
    logger = new(winston.Logger)({
        transports: [
            new(winston.transports.Console)({ colorize: true }),
        ]
    });
} else {
    logger = new(winston.Logger)({
        transports: [
            new(winston.transports.File)({
                name: 'error-file',
                filename: './logs/filelog-error.log',
                level: 'error'
            })
        ]
    });
}

module.exports = logger;