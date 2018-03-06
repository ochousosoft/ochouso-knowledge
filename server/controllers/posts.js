
/**
 * Created by sotelo on 06/04/2017.
 */
var util = require('../nutjs/util/util');
var DataModel = require('../nutjs/util/datamodel');
var model = require('../models/Post');
var adapter = util.getAdapter(model);

var authorization = require('../nutjs/security/authorization');
var Promise = require("bluebird");
var logger = require("../config/logger");

var app = require('../server');
var env = require("../config/env");
var mode = app.get('env');
var secret = require('../config/secret');
var jwt = require('jsonwebtoken');


exports.find = {};
exports.find.verb = 'get';
exports.find.path = '/server/api/posts';
exports.find.method = function (req, res) {
    //var authData = authorization.decodeAuthToken(req, res);
    var reqParams = util.extractReqParams(req);
    reqParams.where = (reqParams.where?JSON.parse(reqParams.where):{});

    var parameters = adapter.validateFind(reqParams, model);
    adapter.find(parameters).then(function (response) {
        res.json(response);
    }).catch(function (err) {
        logger.error(err);
        var datamodelErr = adapter.handleError(err);
        res.json(datamodelErr);
    });
};


exports.findOne = {};
exports.findOne.verb = 'get';
exports.findOne.path = '/server/api/post';
exports.findOne.method = function (req, res) {
    //var authData = authorization.decodeAuthToken(req, res);
    var reqParams = util.extractReqParams(req);
    //if (util.customAccessGranted(reqParams.where, authData.data.companies, 'id', 'company_id', res)) {
        var parameters = adapter.validateFindOne(reqParams, model);
        var datamodel = new DataModel();
        adapter.findOne(parameters).then(function (response) {
            res.json(response);
        }).catch(function (err) {
            logger.error(err);
            var datamodelErr = adapter.handleError(err);
            res.json(datamodelErr);
        });
    //}
    ;
};


exports.save = {};
exports.save.verb = 'post';
exports.save.path = '/server/api/posts';
exports.save.method = function (req, res) {
    //var authData = authorization.decodeAuthToken(req, res);
    //var user_id = authData.data.id;

    var reqBodyParams = req.body;
    if(!util.isObject(reqBodyParams)){
        reqBodyParams = JSON.parse(reqBodyParams);
    }
    var parameters = adapter.validateSave(reqBodyParams, model);
    adapter.transaction(function (client) {
        var datamodel = new DataModel();
        if (reqBodyParams.data.hasOwnProperty(model.pk)) {
            return adapter.updateT(parameters, client).then(function (result){
                datamodel.code = 200;
                datamodel.result = result[0].rows[0];
                res.json(datamodel)
            });
        } else {
            return adapter.insertT(parameters, client).then(function (result){
                datamodel.code = 200;
                datamodel.result = result[0].rows[0];
                res.json(datamodel)
            });
        }
    }).catch(function (err) {
        logger.error(err);
        var datamodelErr = adapter.handleError(err);
        res.json(datamodelErr);
    });
};

exports.saveOne = {};
exports.saveOne.verb = 'post';
exports.saveOne.path = '/server/api/post';
exports.saveOne.method = function (req, res) {
    //var authData = authorization.decodeAuthToken(req, res);
    //var user_id = authData.data.id;
    var reqBodyParams = req.body;

    adapter.transaction(function (client) {
        return adapter.saveOneT(reqBodyParams, model, client).then(function (result){
            var datamodel = new DataModel();
            datamodel.code = 200;
            datamodel.result = result.result.data;
            res.json(datamodel)
        });

    }).catch(function (err) {
        logger.error(err);
        var datamodelErr = adapter.handleError(err);
        res.json(datamodelErr);
    });
};

exports.delete = {};
exports.delete.verb = 'delete';
exports.delete.path = '/server/api/post';
exports.delete.method = function (req, res) {
    //var authData = authorization.decodeAuthToken(req, res);
    //var user_id = authData.data.id;

    var reqParams = util.extractReqParams(req);
    var parameters = adapter.validateDelete(reqParams, model);

    adapter.transaction(function (client) {
        var datamodel = new DataModel();
        var speaker_id = parameters.where.id;
        var deleteSpeakerParams = {where:{speaker_id:JSON.parse(parameters.where).id}};
        deleteSpeakerParams = adapter.validateDelete(deleteSpeakerParams, modelLang);
        adapter.deleteT(parameters, client).then(function (result){
            return result;
        }).then(function () {
            return adapter.deleteT(parameters, client).then(function (result){
                datamodel.code = 200;
                datamodel.result = result[0].rows[0];
                res.json(datamodel)
            });
        });
    }).catch(function (err) {
        logger.error(err);
        var datamodelErr = adapter.handleError(err);
        res.json(datamodelErr);
    });
};
