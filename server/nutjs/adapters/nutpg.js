var pg = require('pg');
var async = require('async');
var DataModel = require('../util/datamodel');
var logger = require("../../config/logger");
var Util = require('../util/util');
var Pool = pg.Pool;
var Promise = require("bluebird");
Promise.promisifyAll(pg, {
    multiArgs: true
});
Promise.config({
    longStackTraces: true
});

var mode = require("../../config/mode");

var debugging;

if (mode == 'development') {
    debugging = true;
} else {
    debugging = false;
}
debugging = false; //Coment if you want debug sqls in development


var dictionary = {
    select: 'SELECT ',
    insert: 'INSERT INTO ',
    update: 'UPDATE ',
    delete: 'DELETE FROM ',
    values: ' VALUES ',
    returning: ' RETURNING * ',
    set: ' SET ',
    asterisk: ' * ',
    from: ' FROM ',
    left_join: ' LEFT JOIN ',
    right_join: ' RIGHT JOIN ',
    inner: ' INNER JOIN ',
    on: ' ON ',
    where: ' WHERE ',
    limit: ' LIMIT ',
    offset: ' OFFSET ',
    order_by: ' ORDER BY ',
    group_by: ' GROUP BY ',
    $like: ' ILIKE ',
    $nlike: ' NOT LIKE ',
    $eq: ' = ',
    $gt: ' > ',
    $gte: ' >= ',
    $lt: ' < ',
    $lte: ' <= ',
    $ne: ' <> ',
    $in: ' IN ',
    $nin: ' NOT IN ',
    $null: ' IS NULL ', //comment: {$nnull: null}
    $nnull: ' IS NOT NULL ',
    $and: ' AND ',
    $or: ' OR '
};

var Adapter = function(config) {
    this.config = config;
    config.Promise = Promise;
    this.pool = new Pool(config);
};

Adapter.prototype.getConnection = function(fn) {
    return Promise.using(this.pool.connect(), function(connection) {
        return Promise.try(function() {
                return fn(connection);
            })
            .then(function(res) {
                connection.release();
                return res;
            })
            .catch(function(err) {
                connection.release();
                throw err;
            })
    });
};

Adapter.prototype.transaction = function(fn) {
    return Promise.using(this.pool.connect(), function(connection) {
        return Promise.try(function() {
                return connection.queryAsync('BEGIN').then(function() {
                    return fn(connection);
                });
            })
            .then(function(res) {
                return connection.queryAsync('COMMIT').then(function() {
                    connection.release();
                    return res;
                });
            })
            .catch(function(err) {
                return connection.queryAsync('ROLLBACK').then(function() {
                    connection.release();
                    throw err;
                })
            });
    });
};

Adapter.prototype.handleError = function(err) {
    var datamodel = new DataModel();
    if (err.code) {
        switch (err.code) {
            case '23505':
                //Duplicate Key Value Violates Unique restriction
                datamodel.code = 601;
                break;

            case '28P01':
                //password authentication failed for user "postgres"
                datamodel.code = 600;
                break;

            case 'ENOENT':
                //respuesta vacía
                datamodel.code = 604;
                break;

            case 'ENETUNREACH':
                //No internet connection
                datamodel.code = 404;
                break;

            case 'INCORRECTPWD':
                //Incorrect pwd
                datamodel.code = 705;
                break;

            case 'ACCESSDENIED':
                //Access Denied
                datamodel.code = 706;
                break;

            default:
                // Generic DB Error
                if (err.code) {
                    datamodel.code = err.code;
                } else {
                    datamodel.code = 600;
                }
        }
        datamodel.msg = 'ERROR: ' + err.message;
    } else {
        datamodel.code = 500;
        datamodel.msg = err;
    }
    if (err.result) {
        datamodel.result = err.result;
    }
    return datamodel;
};

Adapter.prototype.validateFind = function(reqParams, Model) {
    //TODO perform validation here
    reqParams['pk'] = Model.pk;
    if (!reqParams.hasOwnProperty('projection')) {
        reqParams['projection'] = 'default';
        reqParams['from'] = Model.projections['default'].from;
    } else {
        reqParams['from'] = Model.projections[reqParams['projection']].from;
    }

    if (reqParams.hasOwnProperty('select') && reqParams.select !== undefined) {
        if (reqParams.select.length == 0) {
            reqParams.select = Model.projections[reqParams.projection].find;
        }
    } else {
        reqParams.select = Model.projections[reqParams.projection].find;
    }

    reqParams['countColumn'] = (Model.projections[reqParams['projection']].hasOwnProperty('countColumn')) ? (Model.projections[reqParams['projection']].from + '.' + Model.projections[reqParams['projection']].countColumn).trim() : null;

    if (Model.projections[reqParams['projection']].hasOwnProperty('fk')) {
        reqParams['fk'] = Model.projections[reqParams['projection']].fk;
    }
    if (Model.projections[reqParams['projection']].hasOwnProperty('translation')) {
        reqParams['translation'] = Model.projections[reqParams['projection']].translation;
    }
    if (reqParams.select) {
        reqParams.select = Util.changeRelationatedColumns(reqParams, Model, 'select');
    }
    if (reqParams.where) {
        reqParams.where = Util.changeRelationatedColumns(reqParams, Model, 'where');
    }
    if (reqParams.order_by) {
        reqParams.order_by = Util.changeRelationatedColumns(reqParams, Model, 'order_by');
    }
    return reqParams;
};


Adapter.prototype.validateExport = function(reqParams, Model) {
    //Method that check if params to export to a doc are correct
    if (!reqParams.hasOwnProperty('projection')) {
        reqParams.projection = 'default';
    }
    if (!reqParams.hasOwnProperty('filters')) {
        reqParams.filters = '';
    }
    if (!reqParams.hasOwnProperty('title')) {
        reqParams.title = '';
    }
    if (!reqParams.hasOwnProperty('filename')) {
        reqParams.filename = 'blank.txt';
    }
    if (!reqParams.hasOwnProperty('template')) {
        reqParams.template = {
            dir: 'default',
            preTable: '',
            postTable: ''
        };
    }
    if (!reqParams.hasOwnProperty('columns')) {
        reqParams.columns = Model.projections[reqParams.projection].find;
    } else {
        var exportColumns = [];
        for (var i = 0; i < reqParams.columns.length; i++) {
            for (var j = 0; j < Model.projections[reqParams.projection].find.length; j++) {
                if (reqParams.columns[i].column === Model.projections[reqParams.projection].find[j]) {
                    exportColumns.push(reqParams.columns[i]);
                }
            }
        }
        reqParams.columns = exportColumns;
    }
    reqParams.select = [];
    for (var i = 0; i < reqParams.columns.length; i++) {
        reqParams.select.push(Model.projections[reqParams.projection].from + '.' + reqParams.columns[i].column);
    }
    reqParams.where = reqParams.filters;

    return reqParams;
};

Adapter.prototype.validateFindOne = function(reqParams, Model) {
    //TODO perform validation here
    reqParams['pk'] = Model.pk;
    if (!reqParams.hasOwnProperty('projection')) {
        reqParams['projection'] = 'default';
    }
    reqParams['from'] = Model.projections[reqParams['projection']].from;

    reqParams['countColumn'] = (Model.projections[reqParams['projection']].hasOwnProperty('countColumn')) ? (Model.projections[reqParams['projection']].from + '.' + Model.projections[reqParams['projection']].countColumn).trim() : null;

    if (Model.projections[reqParams['projection']].hasOwnProperty('fk')) {
        reqParams['fk'] = Model.projections[reqParams['projection']].fk;
    }
    if (Model.projections[reqParams['projection']].hasOwnProperty('translation')) {
        reqParams['translation'] = Model.projections[reqParams['projection']].translation;
    }
    if (Model.projections[reqParams['projection']].hasOwnProperty('oneToN')) {
        reqParams['oneToN'] = Model.projections[reqParams['projection']].oneToN;
    }
    if (Model.projections[reqParams['projection']].hasOwnProperty('NtoM')) {
        reqParams['NtoM'] = Model.projections[reqParams['projection']].NtoM;
    }
    if (Model.hasOwnProperty('countColumn')) {
        reqParams['countColumn'] = Model.projections[reqParams['projection']].countColumn;
    }

    if (reqParams.hasOwnProperty('select') && reqParams.select !== undefined) {
        if (reqParams.select.length == 0) {
            reqParams.select = Model.projections[reqParams.projection].find;
        }
    } else {
        reqParams.select = Model.projections[reqParams.projection].find;
    }
    if (reqParams.select) {
        reqParams.select = Util.changeRelationatedColumns(reqParams, Model, 'select');
    }

    if (reqParams.where) {
        reqParams.where = Util.changeRelationatedColumns(reqParams, Model, 'where');
    }
    if (reqParams.order_by) {
        reqParams.order_by = Util.changeRelationatedColumns(reqParams, Model, 'order_by');
    }

    return reqParams;
};

Adapter.prototype.validateSave = function(reqBodyParams, Model) {
    console.log(reqBodyParams.hasOwnProperty('projection'))
    var saveValues = {};
    if (!reqBodyParams.hasOwnProperty('projection')) {
        reqBodyParams['projection'] = 'default';
        console.log('xxxxxxxxxxxxxx')
    }
    console.log(reqBodyParams)
    var saveColumns = Model.projections[reqBodyParams['projection']].save;
    for (var saveCol in reqBodyParams.data) {
        if (saveColumns.indexOf(saveCol) >= 0) {
            if (reqBodyParams.data[saveCol] === 0) {
                saveValues[saveCol] = reqBodyParams.data[saveCol];
            } else {
                saveValues[saveCol] = Util.objectize(reqBodyParams.data[saveCol], Model.columns[saveCol]);
            }
        }
    }
    var saveInfo = {};
    if (reqBodyParams.data[Model.pk]) {
        //update method, pk must be included in where statement

        var where = {};
        where[Model.pk] = reqBodyParams.data[Model.pk];
        saveInfo['where'] = where;
    }
    saveInfo['table'] = Model.table;
    //TODO delete
    //saveValues['idej'] = 0;
    saveInfo['values'] = saveValues;

    return saveInfo;
};

Adapter.prototype.validateSaveNM = function(data, NtoM, idN, Model) {
    var NMrecords = [];
    var saveColumns = Model.projections['default'].save;
    for (var i = 0; i < data.length; i++) {
        var record = data[i];
        record[NtoM.NM.columnN] = idN;
        // record[NtoM.NM.columnM] = record[NtoM.M.columnM];

        for (var saveCol in record) {
            if (saveColumns.indexOf(saveCol) >= 0) {
                record[saveCol] = record[saveCol];
            } else {
                if (saveCol.indexOf('$$deleted') < 0 && saveCol !== 'id') {
                    delete record[saveCol];
                }
            }
        }
        NMrecords.push(record);
    }

    return NMrecords;
};

Adapter.prototype.validateBulk = function(reqBodyParams, Model) {
    var saveValues = {};
    if (!reqBodyParams.hasOwnProperty('projection')) {
        reqBodyParams['projection'] = 'default';
    }
    var saveColumns = Model.projections[reqBodyParams['projection']].save;
    for (var saveCol in reqBodyParams.data) {
        if (saveColumns.indexOf(saveCol) >= 0) {
            saveValues[saveCol] = reqBodyParams.data[saveCol];
        }
    }
    var saveInfo = {};
    saveInfo['table'] = Model.table;
    //TODO delete
    //saveValues['idej'] = 0;
    saveInfo['values'] = saveValues;

    if (saveValues[Object.keys(saveValues)[0]].length == 0) {
        saveInfo = false;
    }

    return saveInfo;
};

Adapter.prototype.validateDelete = function(reqParams, Model) {
    reqParams['table'] = Model.table;
    reqParams['pk'] = Model.pk;
    return reqParams;
};

Adapter.prototype.findOne = function(parameters) {
    var adapter = this;
    return adapter.getConnection(function(client) {
        return adapter.findT(parameters, client).then(function(response) {
            var mainItem = response[0].rows[0];
            var promises = [];
            if (mainItem) {
                if (parameters.oneToN) {
                    for (var i = 0; i < parameters.oneToN.length; i++) {
                        var processOneToN = function(tableN) {
                            var modelN = require('../../models/' + tableN.modelN);
                            var adapterN = Util.getAdapter(modelN);
                            var reqParamsN = {};
                            reqParamsN.select = modelN.projections[tableN.find.projection].find;
                            reqParamsN.select = Util.changeRelationatedColumns(reqParamsN, modelN, 'select');
                            reqParamsN.where = {};
                            reqParamsN.where[tableN.columnN] = mainItem[tableN.column];
                            reqParamsN.projection = tableN.find.projection;
                            if (tableN.orderBy) {
                                reqParamsN.order_by = tableN.orderBy;
                            } else if (modelN.pk) {
                                reqParamsN.order_by = modelN.pk;
                            }
                            var parametersR = adapterN.validateFind(reqParamsN, modelN);
                            return adapterN.findT(parametersR, client).then(function(response) {
                                mainItem[tableN.find.column] = response[0].rows;
                            });
                        }(parameters.oneToN[i]);
                        promises.push(processOneToN);
                    }
                }
                if (parameters.NtoM) {
                    for (var i = 0; i < parameters.NtoM.length; i++) {
                        var processNToM = function(tableNM) {
                            var modelNM = require('../../models/' + tableNM.NM.modelNM);
                            var adapterNM = Util.getAdapter(modelNM);
                            var reqParamsNM = {};
                            reqParamsNM.NtoM = tableNM;
                            reqParamsNM.NtoM.NMjoinValue = mainItem[tableNM.N.columnN];
                            var parametersNM = adapterNM.validateFind(reqParamsNM, modelNM);
                            return adapterNM.findNMT(parametersNM, client).then(function(response) {
                                mainItem[tableNM.find.column] = response[0].rows;
                            });
                        }(parameters.NtoM[i]);
                        promises.push(processNToM);
                    }
                }
            }
            return Promise.all(promises).then(function(response) {
                var datamodel = new DataModel(mainItem);
                return datamodel;
            });
        });
    });
};

Adapter.prototype.findOneT = function(parameters, client) {
    var adapter = this;
    return adapter.findT(parameters, client).then(function(response) {
        var mainItem = response[0].rows[0];
        var promises = [];
        if (mainItem) {
            if (parameters.oneToN) {
                for (var i = 0; i < parameters.oneToN.length; i++) {
                    var processOneToN = function(tableN) {
                        var modelN = require('../../models/' + tableN.modelN);
                        var adapterN = Util.getAdapter(modelN);
                        var reqParamsN = {};
                        reqParamsN.select = modelN.projections[tableN.find.projection].find;
                        reqParamsN.select = Util.changeRelationatedColumns(reqParamsN, modelN, 'select');
                        reqParamsN.where = {};
                        reqParamsN.where[tableN.columnN] = mainItem[tableN.column];
                        reqParamsN.projection = tableN.find.projection;
                        if (tableN.orderBy) {
                            reqParamsN.order_by = tableN.orderBy;
                        } else if (modelN.pk) {
                            reqParamsN.order_by = modelN.pk;
                        }
                        var parametersR = adapterN.validateFind(reqParamsN, modelN);
                        return adapterN.findT(parametersR, client).then(function(response) {
                            mainItem[tableN.find.column] = response[0].rows;
                        });
                    }(parameters.oneToN[i]);
                    promises.push(processOneToN);
                }
            }
            if (parameters.NtoM) {
                for (var i = 0; i < parameters.NtoM.length; i++) {
                    var processNToM = function(tableNM) {
                        var modelNM = require('../../models/' + tableNM.NM.modelNM);
                        var adapterNM = Util.getAdapter(modelNM);
                        var reqParamsNM = {};
                        reqParamsNM.NtoM = tableNM;
                        reqParamsNM.NtoM.NMjoinValue = mainItem[tableNM.N.columnN];
                        var parametersNM = adapterNM.validateFind(reqParamsNM, modelNM);
                        return adapterNM.findNMT(parametersNM, client).then(function(response) {
                            mainItem[tableNM.find.column] = response[0].rows;
                        });
                    }(parameters.NtoM[i]);
                    promises.push(processNToM);
                }
            }
        }
        return Promise.all(promises).then(function(response) {
            var datamodel = new DataModel(mainItem);
            return datamodel;
        });
    });
};

Adapter.prototype.saveOne = function(reqBodyParams, Model) {
    var adapter = this;
    var mainItem;
    var promises = [];

    return adapter.transaction(function(client) {
        if (!reqBodyParams.hasOwnProperty('projection')) {
            reqBodyParams['projection'] = 'default';
        }
        var saveValues = adapter.validateSave(reqBodyParams, Model);
        if (reqBodyParams.data.hasOwnProperty(Model.pk)) {
            return adapter.updateT(saveValues, client).then(function(response) {
                mainItem = response[0].rows[0];
                return saveOneRelationed(reqBodyParams, Model, mainItem, client);
            });
        } else {
            if (!reqBodyParams.data.hasOwnProperty(Model.auto) && Model.auto !== '') {
                var query = "UPDATE counters SET current = current+1 where table_name='" + Model.table + "' returning lpad(current::text, num_digits, '0') as current";
                var parameters = {};
                parameters.sql = query;
                return adapter.execsqlT(parameters, client).then(function(response) {
                    saveValues.values[Model.auto] = response[0].rows[0].current;
                    adapter.insertT(saveValues, client).then(function(response) {
                        mainItem = response[0].rows[0];
                        return saveOneRelationed(reqBodyParams, Model, mainItem, client);
                    });
                });
            } else {
                return adapter.insertT(saveValues, client).then(function(response) {
                    mainItem = response[0].rows[0];
                    return saveOneRelationed(reqBodyParams, Model, mainItem, client);
                });
            }
        }

    });
};

Adapter.prototype.saveOneT = function(reqBodyParams, Model, client) {
    var adapter = this;
    var mainItem;
    var promises = [];

    if (!reqBodyParams.hasOwnProperty('projection')) {
        reqBodyParams['projection'] = 'default';
    }
    var saveValues = adapter.validateSave(reqBodyParams, Model);
    if (reqBodyParams.data.hasOwnProperty(Model.pk)) {
        return adapter.updateT(saveValues, client).then(function(response) {
            mainItem = response[0].rows[0];
            return saveOneRelationed(reqBodyParams, Model, mainItem, client);
        });
    } else {
        if (!reqBodyParams.data.hasOwnProperty(Model.auto) && Model.auto !== '') {
            var query = "UPDATE counters SET current = current+1 where table_name='" + Model.table + "' returning lpad(current::text, num_digits, '0') as current";
            var parameters = {};
            parameters.sql = query;
            return adapter.execsqlT(parameters, client).then(function(response) {
                saveValues.values[Model.auto] = response[0].rows[0].current;
                adapter.insertT(saveValues, client).then(function(response) {
                    mainItem = response[0].rows[0];
                    return saveOneRelationed(reqBodyParams, Model, mainItem, client);
                });
            });
        } else {
            return adapter.insertT(saveValues, client).then(function(response) {
                mainItem = response[0].rows[0];
                if (debugging) {
                    logger.info(mainItem);
                }
                return saveOneRelationed(reqBodyParams, Model, mainItem, client);

            });
        }
    }
};

function saveOneRelationed(reqBodyParams, Model, mainItem, client) {
    var promises = [];
    var oneToN = Model.projections[reqBodyParams['projection']].oneToN;
    if (oneToN) {
        for (var i = 0; i < oneToN.length; i++) {
            var tableN = oneToN[i];
            var modelN = require('../../models/' + tableN.modelN);
            var adapterN = Util.getAdapter(modelN);
            var data = reqBodyParams.data[tableN.find.column];
            if (data) {
                mainItem[tableN.find.column] = [];
                for (var j = 0; j < data.length; j++) {
                    var element = data[j];
                    var op = function(element, tableN) {
                        if (!element[tableN.columnN]) {
                            element[tableN.columnN] = mainItem[tableN.column];
                        }
                        var save = {};
                        save.data = element;
                        if (element.hasOwnProperty('$$deleted')) {
                            var parameters = adapterN.validateSave(save, modelN);
                            return adapterN.deleteT(parameters, client);
                        } else {
                            var parameters = adapterN.validateSave(save, modelN);
                            if (element.hasOwnProperty(modelN.pk)) {
                                return adapterN.updateT(parameters, client).then(function(response) {
                                    if (debugging) {
                                        logger.info(response[0].rows[0]);
                                    }
                                    mainItem[tableN.find.column].push(response[0].rows[0])
                                });
                            } else {
                                return adapterN.insertT(parameters, client).then(function(response) {
                                    if (debugging) {
                                        logger.info(response[0].rows[0]);
                                    }
                                    mainItem[tableN.find.column].push(response[0].rows[0])
                                });
                            }
                        }
                    }(element, tableN);
                    promises.push(op);
                }
            }
        }
    }
    //Extract NtoM
    var NtoM = Model.projections[reqBodyParams['projection']].NtoM;
    if (NtoM) {
        var i = 0;
        for (var i = 0; i < NtoM.length; i++) {
            var tableNM = NtoM[i];
            var modelNM = require('../../models/' + tableNM.NM.modelNM);
            var adapterNM = Util.getAdapter(modelNM);
            var data = reqBodyParams.data[tableNM.find.column];
            if (data) {
                var idN = mainItem.id;
                data = adapterNM.validateSaveNM(data, tableNM, idN, modelNM);

                for (var j = 0; j < data.length; j++) {
                    var op = function(element) {
                        if (!element[tableNM.NM.columnN]) {
                            element[tableNM.NM.columnN] = mainItem[tableNM.N.columnN];
                        }
                        var save = {};
                        save.data = element;
                        if (element.hasOwnProperty('$$deleted')) {
                            var parameters = adapterNM.validateSave(save, modelNM);
                            return adapterNM.deleteT(parameters, client);
                        } else {
                            var parameters = adapterNM.validateSave(save, modelNM);
                            if (element.hasOwnProperty(modelNM.pk)) {
                                return adapterNM.updateT(parameters, client);
                            } else {
                                return adapterNM.insertT(parameters, client);
                            }
                        }
                    }(data[j]);
                    promises.push(op);
                }
            }
        }
    }
    return Promise.all(promises).then(function(response) {
        var datamodel = new DataModel(mainItem);
        return datamodel;
    });
}

Adapter.prototype.find = function(parameters) {
    return this.getConnection(function(client) {
        var query = buildSqlSelect(parameters);
        return client.queryAsync(query.sql, query.values).then(function(response) {
            var datamodel = new DataModel(response[0].rows);
            return datamodel;
        });
    });
};

Adapter.prototype.findT = function(parameters, tx) {
    var query = buildSqlSelect(parameters);
    return tx.queryAsync(query.sql, query.values).catch(function(err) {
        logger.error(query);
        throw new Error(err)
    });
};

Adapter.prototype.insert = function(parameters) {
    return this.getConnection(function(client) {
        var query = buildSqlInsert(parameters);
        return client.queryAsync(query.sql, query.values).then(function(response) {
            var datamodel = new DataModel(response[0].rows[0]);
            return datamodel;
        });
    });
};

Adapter.prototype.insertT = function(parameters, tx) {
    var query = buildSqlInsert(parameters);
    return tx.queryAsync(query.sql, query.values);
};

Adapter.prototype.bulk = function(parameters) {
    return this.getConnection(function(client) {
        var query = buildSqlBulkInsert(parameters);
        return client.queryAsync(query.sql, query.values).then(function(response) {
            var datamodel = new DataModel(response[0].rows[0]);
            return datamodel;
        });

    });
};

Adapter.prototype.bulkT = function(parameters, tx) {
    var query = buildSqlBulkInsert(parameters);
    return tx.queryAsync(query.sql, query.values);
};

Adapter.prototype.update = function(parameters) {
    return this.getConnection(function(client) {
        var query = buildSqlUpdate(parameters);
        return client.queryAsync(query.sql, query.values).then(function(response) {
            var datamodel = new DataModel(response[0].rows[0]);
            return datamodel;
        });
    });
};

Adapter.prototype.updateT = function(parameters, tx) {
    var query = buildSqlUpdate(parameters);
    return tx.queryAsync(query.sql, query.values);
};

Adapter.prototype.delete = function(parameters) {
    return this.getConnection(function(client) {
        var query = buildSqlDelete(parameters);
        return client.queryAsync(query.sql, query.values).then(function(response) {
            var datamodel = new DataModel(response[0].rows);
            return datamodel;
        });
    });
};

Adapter.prototype.deleteT = function(parameters, tx) {
    var query = buildSqlDelete(parameters);
    return tx.queryAsync(query.sql, query.values);
};

Adapter.prototype.execsql = function(parameters) {
    return this.getConnection(function(client) {
        if (!parameters.values) {
            parameters.values = [];
        }
        return client.queryAsync(parameters.sql, parameters.values).then(function(response) {
            var datamodel = new DataModel(response[0].rows);
            return datamodel;
        });
    });
};

Adapter.prototype.execsqlT = function(parameters, tx) {
    if (!parameters.values) {
        parameters.values = [];
    }
    return tx.queryAsync(parameters.sql, parameters.values);
};

Adapter.prototype.findNM = function(parameters) {
    return this.getConnection(function(client) {
        var query = buildSqlNM(parameters);
        return client.queryAsync(query.sql, query.values).then(function(response) {
            var datamodel = new DataModel(response[0].rows);
            return datamodel;
        });
    });
};

Adapter.prototype.findNMT = function(parameters, tx) {
    var query = buildSqlNM(parameters);
    return tx.queryAsync(query.sql, query.values);
};

var buildSqlInsert = function(insertInfo) {
    var query = {
        sql: '',
        values: []
    };
    //build insert statement
    //index parameter
    var i = 0;

    //insert
    var columns = [];
    var insertValues = insertInfo.values;
    if (insertValues && Util.isObject(insertValues)) {
        query.sql += dictionary.insert;
        query.sql += insertInfo.table;
        for (var value in insertValues) {
            query.values.push(insertValues[value]);
            columns.push(value);
        }
        query.sql += Util.parenthesize(columns.toString());
        query.sql += dictionary.values;
        query.sql += Util.parenthesize(Util.dollarizeArray$(columns.length).toString());
        query.sql += dictionary.returning;
    }
    if (debugging) {
        logger.info('SQL: ' + query.sql + '; ->  values: ' + query.values);
    }
    return query;
};

// bulk insert => insercion masiva de datos
var buildSqlBulkInsert = function(insertInfo) {
    var query = {
        sql: '',
        values: []
    };

    //build insert statement
    var insertValues = insertInfo.values;
    if (insertValues && Util.isObject(insertValues)) {
        var bulkObject = Util.buildBulkObject(insertValues);
        if (bulkObject) {
            query.sql += dictionary.insert;
            query.sql += insertInfo.table;
            query.sql += Util.parenthesize(bulkObject.columns.toString());
            query.sql += dictionary.values;
            query.sql += bulkObject.parameters;
            query.values = bulkObject.values;
        }
        if (debugging) {
            logger.info('SQL: ' + query.sql + '; ->  values: ' + query.values);
        }
    }
    return query;
};
// bulk insert

var buildSqlUpdate = function(updateInfo) {
    var query = {
            sql: '',
            values: []
        }
        //build update statement
        //index parameter
    var i = 0;

    //update
    var set = [];
    var updateValues = updateInfo.values;
    if (updateValues && Util.isObject(updateValues)) {
        query.sql += dictionary.update;
        query.sql += updateInfo.table;
        query.sql += dictionary.set;
        var updateKeys = Object.keys(updateValues);
        updateKeys.forEach(function(key, i) {
            set.push(key + ' = ' + Util.dollarize$(i + 1));
            if (i < (updateKeys.length - 1)) {
                set.push(',');
            }
            query.values.push(updateValues[key]);
        });
        i = updateValues.length + 1;
        query.sql += set.join(' ');

    }
    //modify directly query variable, it does not return anything
    buildSqlWhere(query, updateInfo.where, i + 1);
    query.sql += dictionary.returning;
    if (debugging) {
        logger.info('SQL: ' + query.sql + '; ->  values: ' + query.values);
    }
    return query;
};

var buildSqlDelete = function(deleteInfo) {
    var query = {
            sql: '',
            values: []
        }
        //build delete statement

    //delete

    if (deleteInfo.where) {
        if (!Util.isObject(deleteInfo.where)) {
            deleteInfo.where = JSON.parse(deleteInfo.where);
        }
        query.sql += dictionary.delete;
        query.sql += deleteInfo.table;
        //modify directly query variable, it does not return anything
        buildSqlWhere(query, deleteInfo.where, 1);
    }
    if (debugging) {
        logger.info('SQL: ' + query.sql + '; ->  values: ' + query.values);
    }
    return query;
};

var buildSqlSelect = function(queryInfo) {
    var query = {
            sql: '',
            values: []
        }
        //build query
        //index parameter
    var i = 0;

    //select
    var select = [];
    if (queryInfo.select) {
        //one value in select is treated as string
        if (Util.isArray(queryInfo.select)) {
            select = queryInfo.select;
        } else {
            select.push(queryInfo.select);
        }
    }
    if (select.length == 0) {
        select.push(queryInfo.from + '.' + dictionary.asterisk);
    }

    if (queryInfo.fk) {
        for (var i = 0; i < queryInfo.fk.length; i++) {
            var fk = queryInfo.fk[i];
            var modelFK = require('../../models/' + fk.modelFK);

            for (var j = 0; j < fk.find.length; j++) {
                var find = fk.find[j];
                if (fk.alias) {
                    select.push(fk.alias + '.' + find.column + ' AS ' + (find.alias || find.column));
                } else {
                    select.push(modelFK.table + '.' + find.column + ' AS ' + (find.alias || find.column));
                }
            }
        }
    }
    if (queryInfo.translation) {
        var model = require('../../models/' + queryInfo.translation.modelN);
        for (var j = 0; j < queryInfo.translation.find.length; j++) {
            var find = queryInfo.translation.find[j];
            select.push(model.table + '.' + find.column + ' AS ' + find.alias || find.column);
        }
    }

    if (queryInfo.limit) {
        var countColumn = (queryInfo.countColumn != undefined && queryInfo.countColumn.length > 0) ? queryInfo.countColumn : queryInfo.pk;
        if (!queryInfo.pk) {
            countColumn = '*';
        }
        select.push('count(' + countColumn + ') OVER() AS _nut_count');
    }
    select = select.toString();
    query.sql += dictionary.select;
    query.sql += select;

    //from
    var from = queryInfo.from;
    query.sql += dictionary.from;
    query.sql += from;

    if (queryInfo.fk) {
        buildSqlFk(query, queryInfo);
    }

    //where
    var where = {};

    if (queryInfo.where) {
        if (!Util.isObject(queryInfo.where)) {
            where = JSON.parse(queryInfo.where);
        } else {
            where = queryInfo.where;
        }
    }

    if (queryInfo.translation) {
        var model = require('../../models/' + queryInfo.translation.modelN);
        var whereKey = model.table + '.' + queryInfo.translation.languageColumn;
        var language = {};
        language[whereKey] = queryInfo.language;
        where.$and.push(language);
    }

    //modify directly query variable, it does not return anything
    buildSqlWhere(query, where, i);

    var group_by = [];
    if (queryInfo.group_by) {
        if (Util.isArray(queryInfo.group_by)) {
            group_by = queryInfo.group_by;
        } else {
            group_by.push(queryInfo.group_by);
        }
    }
    //modify directly query variable, it does not return anything
    buildSqlGroupBy(query, group_by, i);

    var order_by = [];
    if (queryInfo.order_by) {
        if (Util.isArray(queryInfo.order_by)) {
            order_by = queryInfo.order_by;
        } else {
            order_by.push(queryInfo.order_by);
        }
    }
    buildSqlOrderBy(query, order_by, i);

    buildSqlPagination(query, queryInfo.limit, queryInfo.page);
    if (debugging) {
        logger.info('SQL: ' + query.sql + '; ->  values: ' + query.values);
    }
    return query;
};

var buildSqlWhere = function(query, where) {
    var whereLeft = Object.keys(where);
    if (whereLeft.length > 0) {
        if (query.sql.indexOf(dictionary.where) < 0) {
            query.sql += dictionary.where;
        }
        for (var i = 0; i < whereLeft.length; i++) {
            var whereCondition = whereLeft[i];
            var whereRight = where[whereCondition];
            if (whereCondition.indexOf('$') == 0) {
                //starts with $and, $or and right part is an array with conditions to be chaining
                if (Util.isArray(whereRight)) {
                    for (var k = 0; k < whereRight.length; k++) {
                        var whereItem = whereRight[k];
                        var whereItemKey = Object.keys(whereItem)[0];
                        var whereItemValue = whereItem[whereItemKey];
                        if (whereItemKey.indexOf('$') == 0) {
                            //nested $and and or
                            //recursively
                            query.sql += '(';
                            buildSqlWhere(query, whereItem);
                            query.sql += ')';
                        } else {
                            //individual conditions
                            buildSqlWhereItem(whereItemKey, whereItemValue, query);
                        }
                        if (k < (whereRight.length - 1)) {
                            query.sql += dictionary[whereCondition];
                        }
                    }
                }
            } else {
                buildSqlWhereItem(whereCondition, whereRight, query);
                if (i < (whereLeft.length - 1)) {
                    query.sql += dictionary.$and;
                }
            }
        }
    }
};

var buildSqlWhereItem = function(whereLeft, whereRight, query) {
    if (Util.isObject(whereRight)) {
        //here it may be two situations: literal value  or vector
        //e.g. 'column' :                { '$gt' : 25 } or { '$in' : [25,30] }
        var whereRightKey = Object.keys(whereRight)[0];
        var whereRightValue = whereRight[whereRightKey];
        if (Util.isArray(whereRightValue)) {
            //$in, not in
            query.sql += '('
            query.sql += whereLeft;
            query.sql += dictionary[whereRightKey];
            //add ($1,$2,$n) for in clause
            var in_sql = '';
            for (var j = 0; j < whereRightValue.length; j++) {
                var $index = query.values.length + 1;
                in_sql += Util.dollarize$($index);
                query.values.push(whereRightValue[j]);
                //TODO do better
                if (j < (whereRightValue.length - 1)) {
                    in_sql += ',';
                }
            }
            query.sql += Util.parenthesize(in_sql);
            query.sql += ')';

        } else {
            //$gt, $gte ...
            if (whereRightValue !== null) {
                var $index = query.values.length + 1;
                query.sql += Util.parenthesize(whereLeft + dictionary[whereRightKey] + Util.dollarize$($index));
                query.values.push(whereRightValue);
            } else {
                query.sql += Util.parenthesize(whereLeft + dictionary[whereRightKey]);
            }
        }

    } else {
        //literal value ->  'column' : value
        var $index = query.values.length + 1;
        query.sql += Util.parenthesize(whereLeft + dictionary.$eq + Util.dollarize$($index));
        query.values.push(whereRight);
    }
};

//var buildSqlCount = function(queryInfo) {
////	var query = {
////		sql    : 'SELECT COUNT($1) AS count FROM ' + queryInfo.table,
////		values : [queryInfo.pk]
////	}
////	return query;
//};

var buildSqlGroupBy = function(query, groupBy) {
    if (groupBy.length > 0) {
        query.sql += dictionary.group_by;
        query.sql += groupBy.toString();
    }
}

var buildSqlOrderBy = function(query, orderBy) {
    if (orderBy.length > 0) {
        query.sql += dictionary.order_by;
        for (var i = 0; i < orderBy.length; i++) {
            var orderByItem = orderBy[i];
            try {
                if (!Util.isObject(orderByItem)) {
                    orderByItem = JSON.parse(orderByItem);
                }
                var column = Object.keys(orderByItem)[0];
                var sorting = orderByItem[column];
                query.sql += column;
                query.sql += ' ';
                query.sql += sorting;
            } catch (e) {
                query.sql += orderByItem;
                query.sql += ' ';
                query.sql += 'ASC';
            }
            if (i < (orderBy.length - 1)) {
                query.sql += ',';
            }
        }
    }
};

var buildSqlPagination = function(query, limit, page) {
    if (limit) {
        try {
            var iLimit = parseInt(limit);
            if (iLimit > 0) {
                query.sql += dictionary.limit;
                query.sql += iLimit;
            }
            var iOffset = parseInt(page - 1) * limit; //page 1 -> query begins in record (page*limit -1)
            if (iOffset > 0) {
                query.sql += dictionary.offset;
                query.sql += iOffset;
            }
        } catch (e) {
            logger.error('Warning: LIMIT or OFFSET not valid');
        }
    }
};

var buildSqlGroupBy = function(query, groupBy) {
    if (groupBy.length > 0) {
        query.sql += dictionary.group_by;
        query.sql += groupBy.toString();
    }
};

var buildSqlFk = function(query, info) {
    for (var i = 0; i < info.fk.length; i++) {
        var fk = info.fk[i];
        var modelFK = require('../../models/' + fk.modelFK);
        if (query.sql.indexOf(dictionary.left_join) < 0 && i === 0) {
            query.sql += dictionary.left_join;
        }
        if (i > 0) {
            query.sql += dictionary.left_join;
        }
        query.sql += modelFK.table; // Añadimos tabla: left join TABLA
        //Si tiene alias pone AS en la consulta lo que posibilita hacer varios FKs contra la misma tabla
        if (fk.alias) {
            query.sql += ' AS ' + fk.alias + ' ';
        }

        query.sql += dictionary.on; // Añadimos on: inner join tabla ON
        if (fk.alias) {
            query.sql += fk.alias + "." + fk.columnFK + " = " + info.from + "." + fk.column;
        } else {
            query.sql += modelFK.table + "." + fk.columnFK + " = " + info.from + "." + fk.column;
        }
    }
};

var buildSqlNM = function(queryInfo) {
    var query = {
        sql: '',
        values: []
    }

    var modelNM = require('../../models/' + queryInfo.NtoM.NM.modelNM);
    var modelM = require('../../models/' + queryInfo.NtoM.M.modelM);

    var select = [];
    if (queryInfo.NtoM.find.columnsNM.length !== 0) {
        for (var j = 0; j < queryInfo.NtoM.find.columnsNM.length; j++) {
            if (queryInfo.NtoM.find.columnsNM[j].alias) {
                select.push(modelNM.table + '.' + queryInfo.NtoM.find.columnsNM[j].column + ' as ' + queryInfo.NtoM.find.columnsNM[j].alias);
            } else {
                select.push(modelNM.table + '.' + queryInfo.NtoM.find.columnsNM[j].column);
            }
        }
    } else {
        select.push(modelNM.table + '.*');
    }

    if (queryInfo.NtoM.find.columnsM.length !== 0) {
        for (var j = 0; j < queryInfo.NtoM.find.columnsM.length; j++) {
            if (queryInfo.NtoM.find.columnsM[j].alias) {
                select.push(modelM.table + '.' + queryInfo.NtoM.find.columnsM[j].column + ' as ' + queryInfo.NtoM.find.columnsM[j].alias);
            } else {
                select.push(modelM.table + '.' + queryInfo.NtoM.find.columnsM[j].column);
            }
        }
    } else {
        select.push(modelM.table + '.*');
    }
    select = select.toString();
    query.sql += dictionary.select;
    query.sql += select;

    var from = queryInfo.from;
    query.sql += dictionary.from;
    query.sql += from;

    if (query.sql.indexOf(dictionary.inner) < 0) {
        query.sql += dictionary.inner;
    }

    query.sql += modelM.table; // Add table: inner join TABLE
    query.sql += dictionary.on; // Add on: inner join table ON
    query.sql += modelM.table + "." + queryInfo.NtoM.M.columnM + " = " + modelNM.table + "." + queryInfo.NtoM.NM.columnM;

    var col = modelNM.table + "." + queryInfo.NtoM.NM.columnN;
    if (query.sql.indexOf(dictionary.where) < 0) {
        query.sql += dictionary.where;
    } else {
        query.sql += dictionary.$and;
    }
    query.sql += col + "=" + queryInfo.NtoM.NMjoinValue;
    if (debugging) {
        logger.info('SQL: ' + query.sql + '; ->  values: ' + query.values);
    }
    return query;
};

module.exports = Adapter;