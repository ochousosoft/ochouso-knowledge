//global module to manage json web auth tokens (//https://npmjs.org/package/express-jwt)
var expressJwt = require('express-jwt');
var fileSystem = require('fs');
var Promise = require("bluebird");

var secret = require('../../config/secret');
var app = require('../../server');

var env = require("../../config/env");
var mode = app.get('env');
var logger = require("../../config/logger");


var api_public = env[mode].api_public || [];

//api_public[0] === '*' -> all api routes are public
if ('*' !== api_public[0]) {
    //We are going to protect /api routes with JWT except public api methods (.e.g. login and signup methods)
    app.use(expressJwt({ secret: secret }).unless({ path: api_public }));
    app.use(function(err, req, res, next) {
        if (err.code === 'invalid_token') {
            res.status(440).send('UnauthorizedError: ' + err.message);
        } else {
            res.status(401).send('UnauthorizedError: ' + err.message);
        }
    });
}

//defined datasources
var datasources = {};

fileSystem.readdirSync('./datasources').forEach(function(file) {
    var datasource = require("../../datasources/" + file);
    var Adapter = require('../adapters/' + datasource.adapter);
    datasource.idadapter = datasource.adapter;
    datasource.adapter = new Adapter(datasource.config[app.get('env')]);
    var datasourceId = file.substring(0, file.indexOf('.js'));
    datasources[datasourceId] = datasource;
    logger.info('loader.js: registered datasource -> ' + datasourceId + ' ( adapter: ' + datasource.idadapter + ' )');
});

app.set('datasources', datasources);

fileSystem.readdirSync("./controllers").forEach(function(file) {
    var controller = require("../." + "./controllers/" + file);
    //	logger.info('api.js: registering controller -> ' + file);
    for (var property in controller) {
        var path = '/server/api/' + file.substring(0, file.indexOf('.js'));
        if (controller[property].hasOwnProperty('path')) {
            path = controller[property].path;
        }
        if (controller[property].hasOwnProperty('path')) {
            app[controller[property].verb](path, controller[property]['method']);
        }
        logger.info('method -> ' + property);
    }
    logger.info('loader.js: registered controller -> ' + file);
});
// logger.info('----------------- > Load masters (̶◉͛‿◉̶)');

// fileSystem.readdirSync("./masters").forEach(function (file) {
//     var controller = require("../." + "./masters/" + file);
// //	logger.info('api.js: registering controller -> ' + file);
//     for (var property in controller) {
//         var path = '/server/api/' + file.substring(0, file.indexOf('.js'));
//         if (controller[property].hasOwnProperty('path')) {
//             path = controller[property].path;
//         }
//         if (controller[property].hasOwnProperty('path')) {
//             app[controller[property].verb](path, controller[property]['method']);
//         }
//         logger.info('method -> ' + property);
//     }
//     logger.info('loader.js: registered controller -> ' + file);
// });

// logger.info('----------------- > Load view controllers');

// fileSystem.readdirSync("./views").forEach(function(file) {
//     var controller = require("../." + "./views/" + file);
//     //	logger.info('api.js: registering controller -> ' + file);
//     for (var property in controller) {
//         var path = '/server/api/' + file.substring(0, file.indexOf('.js'));
//         if (controller[property].hasOwnProperty('path')) {
//             path = controller[property].path;
//         }
//         if (controller[property].hasOwnProperty('path')) {
//             app[controller[property].verb](path, controller[property]['method']);
//         }
//         logger.info('method -> ' + property);
//     }
//     logger.info('loader.js: registered controller -> ' + file);
// });



// var readJSFiles = function (dir) {
//     fileSystem.readdirSync(dir).forEach(function (file) {
//         Promise.try().then(function () {
//             var controller = require("../." + dir + file);
// //	logger.info('api.js: registering controller -> ' + file);
//             for (var property in controller) {
//                 var path = '/server/api/' + file.substring(0, file.indexOf('.js'));
//                 if (controller[property].hasOwnProperty('path')) {
//                     path = controller[property].path;
//                 }
//                 if (controller[property].hasOwnProperty('path')) {
//                     app[controller[property].verb](path, controller[property]['method']);
//                 }
//                 logger.info('method -> ' + property);
//             }
//             logger.info('loader.js: registered controller -> ' + file);
//         }).catch(function (err) {
//             readJSFiles(dir + '/' + file + '/')
//         })
//     });
// };
//
// readJSFiles("./controllers");