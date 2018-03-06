var DataModel = require('../util/datamodel');
var Util = require('../util/util');

var net = require('net');
var SEP = String.fromCharCode(2);
var hayServer = (String.fromCharCode(1) + String.fromCharCode(2));
var logger = require("../../config/logger");


var Adapter = function (config) {
    this.config = config;
    this.refreshApp();
}
Adapter.prototype.refreshApp = function (callback) {
    var pg = require('pg');
    var app = require('../../server');
    var Model = require('../../datasources/cocodin_ccdnk.js');
    pg.connect(Model.config[app.get('env')], function (err, client, done) {
        if (err) {
            return logger.error('could not connect to postgres', err);
        }
        var queryConfig = {
            text: 'SELECT iduser,passwd,empresas,ass from users left outer join magic on users.iduser=magic.usu',
        };
        client.query(queryConfig, function (err, result) {
            done();

            var newUsers = {}
            for (var int = 0; int < result.rows.length; int++) {
                var row = result.rows[int];
                if (row.empresas) {
                    newUsers[row.iduser] = {}
                    newUsers[row.iduser] = result.rows[int];
                }
            }
            var queryConfig = {
                text: 'SELECT * from empresas',
            };
            client.query(queryConfig, function (err, result) {
                done();
                var newEmpresas = {}
                for (var int = 0; int < result.rows.length; int++) {
                    var row = result.rows[int];
                    newEmpresas[row.id] = {}
                    newEmpresas[row.id] = result.rows[int];
                }
                app.set('empresas', newEmpresas);
                app.set('users', newUsers);
                console.log(newEmpresas, newUsers);
                console.log('Longitud: ', Object.keys(newEmpresas).length, Object.keys(newUsers).length);
            })
        })
    })
}

Adapter.prototype.getCompanyByUser = function (data, callback, restCallback) {
    var app = require('../../server');
    var empresas = app.get('empresas')
    var users = app.get('users')
    var user = data.query.from.user;
    var password = data.query.from.password;
    var idempresa = data.query.from.idempresa;


    // Comprobamos usuario
    if (!users[user]) {
        var datamodel = new DataModel();
        datamodel.code = 401;
        datamodel.msg = 'No existe usuario';
        restCallback(datamodel)
    }
    else if (users[user]['passwd'] != password) {
        var datamodel = new DataModel();
        datamodel.code = 401;
        datamodel.msg = 'Password incorrecto';
        restCallback(datamodel)

    }
    // Si ya tengo idempresa ,trabajo con ella ,si no la tengo es que intenta hacer login
    // y le envio todas las empresas
    if (idempresa) {
        if (empresas[parseInt(idempresa)]) {
            callback(empresas[parseInt(idempresa)]);
        }
        else {
            var datamodel = new DataModel();
            datamodel.code = 401;
            datamodel.msg = 'Error Empresa';
            restCallback(datamodel)
        }
    } else {
        // Login ,devolvemos empresas en las que puede trabajar
        var us = users[user];
        var companies = [];
        console.log(us.empresas);
        for (var int = 0; int < us.empresas.length; int++) {
            var idempresa = us.empresas[int];
            if (empresas[parseInt(idempresa)]) {
                companies.push(empresas[parseInt(idempresa)])
            }
        }
        console.log(companies);

        var datamodel = new DataModel();
        datamodel.result.data = companies;
        datamodel.result.total = companies.length;
        datamodel.code = 200;
        datamodel.msg = 'OK';
        restCallback(datamodel);

    }

}

Adapter.prototype.exec = function (data, callback) {
    writeData = function (socket, arg, comand) {
        var action = comand + SEP + arg;
        //var lenx = (action.length).toString(16);
        var lenx = Buffer.byteLength(action, 'utf8').toString(16);
        while (lenx.length < 6) {
            lenx = "0" + lenx;
        }
        ok = socket.write(lenx + action);
        if (!ok) {
            console.log('SOCKET CORTADO');
        }
    };
    this.getCompanyByUser(data, function (keySocket) {
        // req.data ,all the parameters to send
        var arg = JSON.stringify(data.query);
        var action = data.params.action;
        var view = data.params.view;

        // var typeAction = req.typeAction || "Insert";

        var login = false;
        var mensaje = "";
        var socket = net.createConnection(keySocket.puerto, keySocket.ip);
        socket.on('data', function (data) {
            var result = data.toString();
            if (result.indexOf(hayServer) != -1) {
                var ARG = keySocket.empresa + ',' + keySocket.usuario + ','
                    + keySocket.contrasenha + ',' + keySocket.aplicacion
                    + ',' + keySocket.ejercicio + ',,';

                writeData(socket, ARG, 'p_logon');

            } else if (result.indexOf(SEP) != -1) {
                var dat = result.split(SEP);

                mensaje += result;

                // Los 6 primeros son el tamaÃ±o ,si es correcto es 000008OK
                var men = dat[0].slice(6, dat[0].length);
                var err = dat[1].toString();
                if (login == true) {
                    socket.end();
                    var dat = mensaje.split(SEP);
                    var data = dat[1].slice(6, dat[1].length);
                    console.log("Received " + parseInt(dat[1].slice(0, 6), 16)
                        + " data");
                    var datamodel = new DataModel();
                    if (err && err.length <= 0) {
                        err = null;
                    }
                    if (err) {
                        console.log('ERROR', err);

                        datamodel.code = 400;
                        datamodel.msg = 'ERROR: ' + err;
                        callback(datamodel);
                        return;
                    }
                    else {
                        // Antes....datamodel.result.data =
                        // JSON.parse(data);
                        result = JSON.parse(data);
                        datamodel.result.data = result.data;
                        if (result.count) {
                            datamodel.result.total = result.count;

                        }
                        else {
                            datamodel.result.total = datamodel.result.data.length;

                        }
                        datamodel.code = 200;
                        datamodel.msg = 'OK';
                        callback(datamodel);
                    }

                }
                if (men == 'Ok') {
                    // Si el login es correcto,ejecutamos la accion
                    login = true;
                    writeData(socket, arg, action + '|' + view);
                } else {
                    socket.end();
                }

            } else {
                mensaje += result.toString();
            }
        });
        socket.on('end', function () {
            // console.log('client disconnected');
        });

    }, callback);
}

Adapter.prototype.validateFind = function (reqParams, Model) {
    // TODO perform validation here
    reqParams['from'] = Model.from;
    reqParams['pk'] = Model.pk;

    reqParams['company'] = Model.company;
    reqParams['select'] = Object.keys(Model.columns);
    return reqParams;
}

Adapter.prototype.find = function (parameters, callback) {
    var query = buildSqlSelect(parameters);
    this.exec(query, callback);

};

Adapter.prototype.insert = function (parameters, callback) {
    var query = buildSqlInsert(parameters);
    this.exec(query, callback);

};

Adapter.prototype.update = function (parameters, callback) {
    var query = buildSqlUpdate(parameters);
    this.exec(query, callback);

};

Adapter.prototype.validateSave = function (reqBodyParams, Model) {
    var saveValues = {};
    var saveColumns = Model.save;
    for (var saveCol in reqBodyParams) {
        if (saveColumns.indexOf(saveCol) >= 0) {
            saveValues[saveCol] = Util.objectize(reqBodyParams[saveCol], Model.columns[saveCol]);
        }
    }
    var saveInfo = {};
    if (reqBodyParams[Model.pk]) {
        // update method, pk must be included in where statement

        var where = {};
        where[Model.pk] = reqBodyParams[Model.pk];
        saveInfo['where'] = where;
    }
    saveInfo['company'] = Model.company;

    saveInfo['table'] = Model.table;
    saveInfo['values'] = saveValues;
    saveInfo['fields'] = Object.keys(Model.columns);

    return saveInfo;
};

// buildSql
var buildSqlUpdate = function (queryInfo) {
    var data = {
        company: '',
        params: {
            action: 'a_save_data',
            view: 'nutjs',
        },
        query: {}
    }
    // arg = JSON.stringify(data.query);

    data.company = queryInfo.company;
    data.query.table = queryInfo.table;
    data.query.where = queryInfo.where;
    data.query.type = 'update';
    data.query.data = queryInfo.values;
    data.query.fields = queryInfo.fields;

    return data;


};
var buildSqlInsert = function (queryInfo) {
    var data = {
        company: '',
        params: {
            action: 'a_save_data',
            view: 'nutjs',
        },
        query: {}
    }
    // arg = JSON.stringify(data.query);

    data.company = queryInfo.company;
    data.query.table = queryInfo.table;
    data.query.type = 'insert';
    data.query.data = queryInfo.values;
    data.query.fields = queryInfo.fields;

    return data;

};
var buildSqlSelect = function (queryInfo) {
    var data = {
        company: '',
        params: {
            action: queryInfo.action || 'a_get_data',
            view: 'nutjs',
        },
        query: {
            from: '',


        }
    }
    data.company = queryInfo.company;
    data.query.from = queryInfo.from;

    if (queryInfo.action) {
        data.query.action = queryInfo.action;
    }
    if (queryInfo.view) {
        data.query.view = queryInfo.view;
    }
    if (queryInfo.select) {
        // one value in select is treated as string
        if (Util.isArray(queryInfo.select)) {
            select = queryInfo.select;
        } else {
            select.push(queryInfo.select);
        }
        data.query.select = queryInfo.select;
    }
    if (queryInfo.order) {
        // one value in select is treated as string
        if (Util.isArray(queryInfo.order)) {
            order = queryInfo.order;
        } else {
            order.push(queryInfo.order);
        }
        data.query.order = queryInfo.order;
    }
    if (queryInfo.limit) {
        data.query.limit = queryInfo.limit;
    }
    if (queryInfo.page) {
        data.query.page = queryInfo.page;
    }
    if (queryInfo.order_by) {
        data.query.order_by = queryInfo.order_by;
    }

    if (queryInfo.where && queryInfo.where.toString() != '{}') {
        var where = []
        data.query.where = buildSqlWhere(queryInfo.where, where);
    }
    return data;
};

//
// Examples
// 'where' : { 'codex' : { '$eq' : '000012' }, 'ar_grp' : { '$eq' : '0001' }},
// 'where' : { 'days' : { '$nnull' : null }, 'codigo' : { '$gt' : 13 }, },
// //days not null and codigo > 13
// 'where' : { 'codigo' : { '$gt' : 13 }, 'days' : { '$nnull' : null }, 'usu' :
// { '$in' : [5,3,99]}, },
// 'where' : { '$or' : [ { 'codigo' : 13 }, { 'days' : { '$nnull' : null }} ,
// {'usu' : { '$in' : [5,3,99]}}] },
// 'where' : {
// '$and' : [
// {'$or' : [ { 'codigo' : 13 }, { 'days' : { '$nnull' : null }} , {'usu' : {
// '$in' : [5,3,99]}}]},
// {'$or' : [ { 'codigo' : 1530 }]}
// ]
// }
var dictionary = {
    select: 'SELECT ',
    asterisk: ' * ',
    from: ' FROM ',
    where: ' WHERE ',
    limit: ' LIMIT ',
    offset: ' OFFSET ',
    order_by: ' ORDER BY ',
    group_by: ' GROUP BY ',

    $like: ' = ',
    $nlike: ' <> ',
    $eq: ' = ',
    $gt: ' > ',
    $gte: ' >= ',
    $lt: ' < ',
    $lte: ' <= ',
    $ne: ' <> ',
    $in: ' = ',
    $nin: ' <> ',
    $and: ' = ',
    $or: ' = ',

    $null: ' IS NULL ',
    $nnull: ' IS NOT NULL ',
};

var buildSqlWhere = function (queryWhere, where) {
    var whereLeft = Object.keys(queryWhere);
    for (var i = 0; i < whereLeft.length; i++) {
        if (whereLeft[i].indexOf('$') < 0) {
            var whereField = whereLeft[i];
            var whereRight = queryWhere[whereField];

            if (Util.isArray(whereRight)) {

            } else {
                var whereFieldLeft = Object.keys(whereRight);
                for (var j = 0; j < whereFieldLeft.length; j++) {
                    if (whereFieldLeft[j].indexOf('$') == 0) {
                        var value = whereRight[whereFieldLeft[j]];// Or array
                        // values
                        var operator = dictionary[whereFieldLeft[j]];

                        if (whereFieldLeft[j] == '$like'
                            || whereFieldLeft[j] == '$nlike'
                            || whereFieldLeft[j] == '$or'
                            || whereFieldLeft[j] == '$and'
                            || whereFieldLeft[j] == '$in'
                            || whereFieldLeft[j] == '$nin') {
                            if (whereFieldLeft[j] == '$like'
                                || whereFieldLeft[j] == '$nlike') {
                                if (value.charAt(0) == '%') {
                                    value = '[' + value;
                                }
                                if (value.charAt(value.length - 1) == '%') {
                                    value = value + ']';
                                }
                                value = value.replace(/%/g, '');

                                where.push([whereField, operator, value]);
                            }

                            else if (whereFieldLeft[j] == '$in' || whereFieldLeft[j] == '$or') {
                                // Array or values
                                where.push([whereField, operator,
                                    value.join('?')]);

                            } else if (whereFieldLeft[j] == '$nin' || whereFieldLeft[j] == '$and') {
                                // Array or values
                                where.push([whereField, operator,
                                    value.join('&')]);
                            }

                        } else {
                            where.push([whereField, operator, value]);

                        }

                    }
                }

            }

        } else {
            // NO WORKS
            var whereField = whereLeft[i];
            var whereRight = queryWhere[whereField];

            if (Util.isArray(whereRight)) {
                // starts with $and, $or and right part is an array with
                // conditions to be chaining
                var queries = {};
                if (!queries[whereField]) {
                    queries[whereField] = {}
                }
                for (var k = 0; k < whereRight.length; k++) {
                    var whereItem = whereRight[k];
                    var whereItemKey = Object.keys(whereItem)[0];
                    var whereItemValue = whereItem[whereItemKey];
                    if (whereItemKey.indexOf('$') == 0) {
                        if (Util.isArray(whereItemValue)) {
                            for (var l = 0; l < whereItemValue.length; l++) {
                                if (!queries[whereField][whereItemValue[l]]) {
                                    queries[whereField][whereItemValue[l]] = [];
                                }

                                queries[whereField][whereItemValue[l]].push(whereItemValue);
                            }

                        }


                    }
                    else {
                        // individual conditions...
                        buildSqlWhere(whereItem, where);
                    }

                }
                console.log(JSON.stringify(queries));
            }
        }

    }
    console.log(where);
    return where;

}
module.exports = Adapter;
