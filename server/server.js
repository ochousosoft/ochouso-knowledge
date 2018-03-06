var express = require('express');
var http = require('http');
var https = require('https');
var fs = require('fs');
var path = require('path');
var cors = require('cors');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var async = require('async');
var opbeat = require('opbeat');
//app files
var mode = require("./config/mode");

var logger = require("./config/logger");
var env = require("./config/env");
var args = process.argv.slice(2);

//App launcher = node server.js development
var mode = args[0] || 'production';

var app = express();

app.set('env', mode);
// all environments

logger.info("Overriding 'Express' logger");


logger.info("Environment set to: " + mode);

app.use(bodyParser.text({
    type: "*/*",
    limit: '150mb',
    parameterLimit: 500000
}));

app.use(methodOverride());
app.use(cors());
app.use(express.static('../client/dist'));
app.use(express.static('./resources'));

if (mode == 'production') {
    app.use(opbeat.middleware.express());
}

http.createServer(app).listen(env[mode].port, function() {
    logger.info('*************************************************');
    logger.info('*                                               *');
    logger.info('*                                               *');
    logger.info('*          *    *   *  *  ***  ***  ****        *');
    logger.info('*          **   *   *  *   *     *  *           *');
    logger.info('*          * *  *   *  *   *     *  ****        *');
    logger.info('*          *  * *   *  *   *   * *     *        *');
    logger.info('*          *   **   ****   *   ***  ****        *');
    logger.info('*                                               *');
    logger.info('*                                               *');
    logger.info('*************************************************');
    logger.info('');
    logger.info('Server listening on port ' + env[mode].port);
});


module.exports = app;

var api = require('./nutjs/engine/loader');