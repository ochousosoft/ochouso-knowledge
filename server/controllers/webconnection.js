var util = require('../nutjs/util/util');
var exporter = require('../nutjs/util/exporter');
var model = require('../models/User');
var modelDevice = require('../models/Device');
var adapter = util.getAdapter(model);
var DataModel = require('../nutjs/util/datamodel');
var app = require('../server');
var jwt = require('jsonwebtoken');
var secret = require('../config/secret');
var crypto = require('crypto');
var moment = require('moment');
var authorization = require('../nutjs/security/authorization');

var handlebars = require('handlebars');

var Promise = require("bluebird");

var logger = require("../config/logger");

// var constantsFile = require('./constants');
// var CONSTANTS = constantsFile.constants;


function find(reqParams, model) {
    var parameters = adapter.validateFind(reqParams, model);
    return adapter.find(parameters).then(function (datamodel) {
            return datamodel.result;
    });
}

function save(params, model){
  return new Promise ((resolve,reject) => {

    var parameters = adapter.validateSave(params, model);
    adapter.transaction(function (client) {
        if (params.data.hasOwnProperty(model.pk)) {
            adapter.updateT(parameters, client).then(function (result){
                resolve(result[0].rows[0]);
            });
        } else {
            return adapter.insertT(parameters, client).then(function (result){
                resolve(result[0].rows[0]);
            });
        }
    });
  });
}

/**
 * [findUser user by server]
 * @param  {[object]} parameters [description]
 * @return {[type]}            [description]
 */
function findUser(reqParams) {
    var parameters = adapter.validateFind(reqParams, model);
    console.log(parameters);
    return adapter.find(parameters).then(function (datamodel) {
        if (datamodel.result.data[0]) {
            return datamodel.result.data[0];
        } else {
            throw new Error('Not found')
        }
    });
}

function findOneUser(reqParams) {
    reqParams.projection = 'login';
    var parameters = adapter.validateFindOne(reqParams, model);
    return adapter.findOne(parameters).then(function (response) {
        if (response.result.data) {
            return response.result.data;
        } else {
            throw new Error('Not found');
        }
    });
}

/**
 * [checkPwd description]
 * @param  {[string]} pdw [decodepwd]
 * @param  {[object]} user [user]
 * @return {[bolean]} [return if is a valid pwd]
 */
function checkPwd(pdw, user) {
    var encodepdw = user[model.password_column];
    var salt = user[model.salt_column];
    return new Promise(function (resolve, reject) {
        crypto.pbkdf2(pdw, salt, 4096, 64, 'sha256', function (err, key) {
            if (err) {
                reject(err);
            } else {
                if (key.toString('base64') === encodepdw) {
                    resolve(user);
                } else {
                    var datamodel = new DataModel();
                    datamodel.code = 400;
                    datamodel.msg = 'incorrect password';
                    reject(datamodel);
                }
            }
        });
    });
}

exports.login = {};
exports.login.verb = 'post';
exports.login.path = '/server/api/login';
exports.login.method = function (req, res) {
    Promise.try(function () {
        var client_credentials = JSON.parse(req.body);
        var credentials = {};

        var user;
        //'user' and 'password' are the name of columns in client-side login-form
        //we need to translate them with model info
        credentials[model.user_column] = client_credentials.username;
        var credentials2 = {};
        credentials2['password'] = client_credentials.password;
        var where = {
            $or: [
                credentials,
                credentials2
            ]
        };

        var params = {where: {username: client_credentials.username, password: client_credentials.password}};

        return findUser(params).then(function (user) {
            //Ckeck actived user
            if (user && user.state === 0) {
                var datamodel = new DataModel();
                datamodel.code = 405;
                datamodel.msg = 'ERROR: not actived user ';
                res.json(datamodel);
            } else {
                delete user[model.password_column];
                var profile = {
                    user: user[model.user_column],
                    data : user,
                    roles: user['roles']
                };

                // We are sending the profile inside the token
                var token = jwt.sign(profile, secret, { expiresIn: 60*60*5 });
                // console.log(token);
                res.status(200);
                res.json({ token: token });
            }
        });
    }).catch(function (err) {
        logger.error(err);
        if (!err.code) {
            res.status(500);
            res.json(err);
        } else {
            res.status(401);
            res.json('Invalid credentials');
        }
    });
};



exports.terminalLogin = {};
exports.terminalLogin.verb = 'post';
exports.terminalLogin.path = '/server/api/app-login';
exports.terminalLogin.method = function (req, res) {
    var bodyparams = JSON.parse(req.body);
    var queryParams = {where: {
        username: bodyparams.user,
        password: bodyparams.password
    }}
    var parameters = adapter.validateFind(queryParams, model);
    console.log(queryParams);
    find(queryParams, model)
      .then((terminal) => {
          console.log(terminal);
          //Ckeck actived user
          if (terminal && typeof(terminal)!='undefined' && terminal.data && terminal.data.length>0){
              if(terminal.data[0].state === 0) {
                  var datamodel = new DataModel();
                  datamodel.code = 405;
                  datamodel.msg = 'ERROR: not actived user ';
                  res.json(datamodel);

              }
              if(terminal.data[0].roles.indexOf('app')==-1) {
                  var datamodel = new DataModel();
                  datamodel.code = 406;
                  datamodel.msg = 'ERROR: Access denied ';
                  res.json(datamodel);

              }  
              else {
                  var parameters = adapter.validateFind({ where: {uuid:bodyparams.deviceInfo.uuid}}, modelDevice);
                  find(parameters, modelDevice)
                    .then((device) => {
                      console.log('DEVICE: ' + device);
                      let saveDevice;
                      if (!device || typeof(device)==='undefined' || !device.data || device.data.length==0){
                        saveDevice = bodyparams.deviceInfo;
                      }
                      else{
                        saveDevice = device.data[0];
                      }

                      saveDevice.terminal_id = terminal.data[0].id;

                      save({data: saveDevice}, modelDevice).then(result=>{
                        console.log('SAVED');
                        console.log(JSON.stringify(result));
                        var datamodel = new DataModel();
                        datamodel.code = 200;
                        datamodel.result = terminal.data[0];
                        datamodel.result.device_id = result.id;
                        res.json(datamodel);
                      });
                  });

              }
          }else{
              var datamodel = new DataModel();
              datamodel.code = 404;
              datamodel.msg = 'ERROR: user does not exists ';
              res.json(datamodel);
          }
      });

};
