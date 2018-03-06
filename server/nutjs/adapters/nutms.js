var ms = require('mssql');
var async = require('async');
var DataModel = require('../util/datamodel');
var logger = require("../../config/logger");
var Util = require('../util/util');

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
    where: ' WHERE ',
    limit: ' LIMIT ',
    offset: ' OFFSET ',
    order_by: ' ORDER BY ',
    group_by: ' GROUP BY ',
    $like: ' LIKE ',
    $nlike: ' NOT LIKE ',
    $eq: ' = ',
    $gt: ' > ',
    $gte: ' >= ',
    $lt: ' < ',
    $lte: ' <= ',
    $ne: ' <> ',
    $in: ' IN ',
    $nin: ' NOT IN ',
    $null: ' IS NULL ',
    $nnull: ' IS NOT NULL ',
    $and: ' AND ',
    $or: ' OR '
};

var Adapter = function (config) {
    this.config = config;
};

Adapter.prototype.validateFind = function (reqParams, Model) {
    //TODO perform validation here
    reqParams['from'] = Model.from;
    reqParams['pk'] = Model.pk;
    return reqParams;
};

Adapter.prototype.find = function (parameters, callback) {

    // get a pg client from the connection pool
    pg.connect(this.config, function (err, client, done) {

        var handleError = function (err) {
            // no error occurred, continue with the request
            if (!err) {
                return false;
            }

            // An error occurred, remove the client from the connection pool.
            // A truthy value passed to done will remove the connection from the pool
            // instead of simply returning it to be reused.
            // In this case, if we have successfully received a client (truthy)
            // then it will be removed from the pool.
            done(client);
            return true;
        };

        var datamodel = new DataModel();

        // handle an error connecting to db
        if (handleError(err)) {
            logger.info('Error connecting to database.');
            datamodel.code = 400;
            datamodel.msg = 'Error connecting to database.';
            callback(datamodel);
            return;
        }

        var query = buildSqlSelect(parameters);

        // query
        client.query(query.sql, query.values, function (err, result) {



            // handle an error from the query
            if (handleError(err)) {
                logger.error(err, result);
                datamodel.code = 400;
                datamodel.msg = 'ERROR: ' + err.message;
                callback(datamodel);
                return;
            }

            datamodel.result.data = result.rows;
            datamodel.result.total = 0;
            if (result.rows.length > 0) {
                datamodel.result.total = parseInt(result.rows[0]._nut_count);
            }

            done();

            datamodel.code = 200;
            datamodel.msg = 'Find OK';
            callback(datamodel);
        });
    });
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
        //update method, pk must be included in where statement

        var where = {};
        where[Model.pk] = reqBodyParams[Model.pk];
        saveInfo['where'] = where;
    }
    saveInfo['table'] = Model.table;
    //TODO delete
    //saveValues['idej'] = 0;
    saveInfo['values'] = saveValues;
    return saveInfo;
};

//var beginTx =  function(client, cb, done) {
//	client.query('BEGIN', function (err) {
//		if (err) {
//			done();
//			return cb(err);
//		}
//	});
//};
//
//var commitTx =  function(client, cb, done) {
//	client.query('BEGIN', function (err) {
//		if (err) {
//			done();
//			return cb(err);
//		}
//	});
//};
//
//var rollbackTx =  function(client, cb, done) {
//	//begin tx
//	client.query('ROLLBACK', function (err) {
//		if (err) {
//			done();
//			return cb(err);
//		}
//	});
//};

Adapter.prototype.transaction = function (tasks, cb) {
    pg.connect(this.config, function (err, client, done) {
        if (err) {
            return cb(err);
        }

        client.query('BEGIN', function (err) {
            if (err) {
                done();
                return cb(err);
            }
            logger.info('BEGIN transaction;');
            var wrapIterator = function (iterator) {
                return function (err) {
                    if (err) {
                        client.query('ROLLBACK', function () {
                            logger.error('ERROR: transaction ROLLBACK;');
                            done();
                            cb(err);
                        });
                    }
                    else {
                        var args = Array.prototype.slice.call(arguments, 1);
                        var next = iterator.next();
                        if (next) {
                            args.unshift(client);
                            args.push(wrapIterator(next));
                        }
                        else {
                            args.unshift(client);
                            args.push(function (err, results) {
                                var args = Array.prototype.slice.call(arguments, 0);
                                if (err) {
                                    client.query('ROLLBACK', function () {
                                        logger.error('ERROR: transaction ROLLBACK;');
                                        done();
                                        cb(err);
                                    });
                                }
                                else {
                                    client.query('COMMIT', function () {
                                        done();
                                        logger.info('COMMIT transaction;');
                                        cb.apply(null, args);

                                    })
                                }
                            })
                        }
                        async.setImmediate(function () {
                            iterator.apply(null, args);
                        });
                    }
                };
            };
            wrapIterator(async.iterator(tasks))();
        });
    });
};

Adapter.prototype.insertT = function (parameters, callback, client) {
    var query = buildSqlInsert(parameters);
    // insert
    client.query(query.sql, query.values, callback);
};

Adapter.prototype.insert = function (parameters, callback) {

    // get a pg client from the connection pool
    pg.connect(this.config, function (err, client, done) {

        var handleError = function (err) {
            // no error occurred, continue with the request
            if (!err) {
                return false;
            }

            // An error occurred, remove the client from the connection pool.
            // A truthy value passed to done will remove the connection from the pool
            // instead of simply returning it to be reused.
            // In this case, if we have successfully received a client (truthy)
            // then it will be removed from the pool.
            done(client);
            return true;
        };

        var datamodel = new DataModel();

        // handle an error connecting to db
        if (handleError(err)) {
            logger.info('Error connecting to database.');
            datamodel.code = 400;
            datamodel.msg = 'Error connecting to database.';
            callback(datamodel);
            return;
        }

        var query = buildSqlInsert(parameters);

        // insert
        client.query(query.sql, query.values, function (err, result) {

            // handle an error from the query
            if (handleError(err)) {
                logger.error(err, result);
                datamodel.code = 400;
                datamodel.msg = 'ERROR: ' + err.message;
                callback(datamodel);
                return;
            }

            datamodel.result.data = result.rows;
            datamodel.result.total = result.rows.length;

            done();

            datamodel.code = 200;
            datamodel.msg = 'New record inserted';
            callback(datamodel);
        });
    });
};

var buildSqlInsert = function (insertInfo) {
    var query = {
        sql: '',
        values: []
    }
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

    logger.info('SQL: ' + query.sql + '; ->  values: ' + query.values);
    return query;
};

Adapter.prototype.updateT = function (parameters, callback, client) {
    var query = buildSqlUpdate(parameters);
    // update
    client.query(query.sql, query.values, callback);
};

Adapter.prototype.update = function (parameters, callback) {

    // get a pg client from the connection pool
    pg.connect(this.config, function (err, client, done) {

        var handleError = function (err) {
            // no error occurred, continue with the request
            if (!err) {
                return false;
            }

            // An error occurred, remove the client from the connection pool.
            // A truthy value passed to done will remove the connection from the pool
            // instead of simply returning it to be reused.
            // In this case, if we have successfully received a client (truthy)
            // then it will be removed from the pool.
            done(client);
            return true;
        };

        var datamodel = new DataModel();

        // handle an error connecting to db
        if (handleError(err)) {
            logger.info('Error connecting to database.');
            datamodel.code = 400;
            datamodel.msg = 'Error connecting to database.';
            callback(datamodel);
            return;
        }

        var query = buildSqlUpdate(parameters);

        // insert
        client.query(query.sql, query.values, function (err, result) {

            // handle an error from the query
            if (handleError(err)) {
                logger.info(err, result);
                datamodel.code = 400;
                datamodel.msg = 'ERROR: ' + err.message;
                callback(datamodel);
                return;
            }

            datamodel.result.data = result.rows;
            datamodel.result.total = result.rows.length;

            done();

            datamodel.code = 200;
            datamodel.msg = 'New record updated';
            callback(datamodel);
        });
    });
};


var buildSqlUpdate = function (updateInfo) {
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
        updateKeys.forEach(function (key, i) {
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

    logger.info('SQL: ' + query.sql + '; ->  values: ' + query.values);
    return query;
};
Adapter.prototype.validateDelete = function (reqParams, Model) {
    //TODO perform validation here
    reqParams['table'] = Model.table;
    reqParams['pk'] = Model.pk;
    return reqParams;
}
Adapter.prototype.deleteT = function (parameters, callback, client) {
    var query = buildSqlDelete(parameters);
    // insert
    client.query(query.sql, query.values, callback);
};
Adapter.prototype.delete = function (parameters, callback) {

    // get a pg client from the connection pool
    pg.connect(this.config, function (err, client, done) {

        var handleError = function (err) {
            // no error occurred, continue with the request
            if (!err) {
                return false;
            }

            // An error occurred, remove the client from the connection pool.
            // A truthy value passed to done will remove the connection from the pool
            // instead of simply returning it to be reused.
            // In this case, if we have successfully received a client (truthy)
            // then it will be removed from the pool.
            done(client);
            return true;
        };

        var datamodel = new DataModel();

        // handle an error connecting to db
        if (handleError(err)) {
            logger.info('Error connecting to database.');
            datamodel.code = 400;
            datamodel.msg = 'Error connecting to database.';
            callback(datamodel);
            return;
        }

        var query = buildSqlDelete(parameters);

        // insert
        client.query(query.sql, query.values, function (err, result) {

            // handle an error from the query
            if (handleError(err)) {
                logger.error(err, result);
                datamodel.code = 400;
                datamodel.msg = 'ERROR: ' + err.message;
                callback(datamodel);
                return;
            }

            datamodel.result.data = result.rows;
            datamodel.result.total = result.rows.length;

            done();

            datamodel.code = 200;
            datamodel.msg = 'Record deleted';
            callback(datamodel);
        });
    });
};

var buildSqlDelete = function (deleteInfo) {
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

    logger.info('SQL: ' + query.sql + '; ->  values: ' + query.values);
    return query;
};

var buildSqlSelect = function (queryInfo) {
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
        }
        else {
            select.push(queryInfo.select);
        }
    }
    if (select.length == 0) {
        select.push(dictionary.asterisk);
    }
    if (queryInfo.limit) {
        var countColumn = queryInfo.pk
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

    //where
    var where = {};

    if (queryInfo.where) {
        if (!Util.isObject(queryInfo.where)) {
            where = JSON.parse(queryInfo.where);
        }
        else {
            where = queryInfo.where;
        }
    }
    //modify directly query variable, it does not return anything
    buildSqlWhere(query, where, i);

    var group_by = [];
    if (queryInfo.group_by) {
        if (Util.isArray(queryInfo.group_by)) {
            group_by = queryInfo.group_by;
        }
        else {
            group_by.push(queryInfo.group_by);
        }
    }
    //modify directly query variable, it does not return anything
    buildSqlGroupBy(query, group_by, i);

    var order_by = [];
    if (queryInfo.order_by) {
        if (Util.isArray(queryInfo.order_by)) {
            order_by = queryInfo.order_by;
        }
        else {
            order_by.push(queryInfo.order_by);
        }
    }
    buildSqlOrderBy(query, order_by, i);

    buildSqlPagination(query, queryInfo.limit, queryInfo.page);

    logger.info('SQL: ' + query.sql + '; ->  values: ' + query.values);
    return query;
};
Adapter.prototype.execsqlT = function (parameters, callback, client) {
    if (!parameters.values) {
        parameters.values = [];
    }
    // exexSQLT
    logger.info('SQL: ' + parameters.sql + '; ->  values: ' + parameters.values);
    client.query(parameters.sql, parameters.values, callback);
};
Adapter.prototype.execsql = function (parameters, callback) {

    // Connection opened
    var connection = new ms.Connection(this.config, function (err) {

        var handleError = function (err) {
            // no error occurred, continue with the request
            if (!err) {
                return false;
            }
            // An error occurred, remove the client from the connection pool.
            return true;
        };

        if (!parameters.values) {
            parameters.values = [];
        }
        logger.info('SQL: ' + parameters.sql + '; ->  values: ' + parameters.values);

        // Request created to run a query mssql
        var request = new ms.Request(connection);
        var consulta;
        if (parameters.sql.table == undefined && parameters.sql.columns == undefined && parameters.sql.where == undefined) {
            consulta = parameters.sql;
        } else {
            var columnas;
            if (parameters.sql.columns == undefined) {
                columnas = dictionary.asterisk;
            } else {
                columnas = parameters.sql.columns.join();
            }

            if (parameters.sql.where == undefined) {
                consulta = 'select ' + columnas + ' from ' + parameters.sql.table;
            } else {
                consulta = 'select ' + columnas + ' from ' + parameters.sql.table + ' where ' + parameters.sql.where;
            }
        }
        //query
        request.query(consulta, function (err, recordset) {
            //logger.info(JSON.stringify(recordset));
            var datamodel = new DataModel();
            if (handleError(err)) {
                logger.error(err, recordset);
                datamodel.code = 400;
                datamodel.msg = 'ERROR: ' + err.message;
                callback(datamodel);
                return;
            }

            datamodel.result.data = recordset;
            datamodel.result.total = recordset.length;

            datamodel.code = 200;
            datamodel.msg = 'SQL executed.';
            callback(datamodel);
            //callback(recordset);
        });
    });
};

var buildSqlWhere = function (query, where) {
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
                        }
                        else {
                            //individual conditions
                            buildSqlWhereItem(whereItemKey, whereItemValue, query);
                        }
                        if (k < (whereRight.length - 1)) {
                            query.sql += dictionary[whereCondition];
                        }
                    }
                }
            }
            else {
                buildSqlWhereItem(whereCondition, whereRight, query);
                if (i < (whereLeft.length - 1)) {
                    query.sql += dictionary.$and;
                }
            }
        }
    }
}

var buildSqlWhereItem = function (whereLeft, whereRight, query) {
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

        }
        else {
            //$gt, $gte ...
            if (whereRightValue !== null) {
                var $index = query.values.length + 1;
                query.sql += Util.parenthesize(whereLeft + dictionary[whereRightKey] + Util.dollarize$($index));
                query.values.push(whereRightValue);
            }
            else {
                query.sql += Util.parenthesize(whereLeft + dictionary[whereRightKey]);
            }
        }

    }
    else {
        //literal value ->  'column' : value
        var $index = query.values.length + 1;
        query.sql += Util.parenthesize(whereLeft + dictionary.$eq + Util.dollarize$($index));
        query.values.push(whereRight);
    }
}

//var buildSqlCount = function(queryInfo) {
////	var query = {
////		sql    : 'SELECT COUNT($1) AS count FROM ' + queryInfo.table,
////		values : [queryInfo.pk]
////	}
////	return query;
//};

var buildSqlGroupBy = function (query, groupBy) {
    if (groupBy.length > 0) {
        query.sql += dictionary.group_by;
        query.sql += groupBy.toString();
    }
}

var buildSqlOrderBy = function (query, orderBy) {
    if (orderBy.length > 0) {
        query.sql += dictionary.order_by;
        for (var i = 0; i < orderBy.length; i++) {
            var orderByItem = orderBy[i];
            try {
                orderByItem = JSON.parse(orderByItem);
                var column = Object.keys(orderByItem)[0];
                var sorting = orderByItem[column];
                query.sql += column;
                query.sql += ' ';
                query.sql += sorting;
            }
            catch (e) {
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
var buildSqlPagination = function (query, limit, page) {
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
        }
        catch (e) {
            logger.error('Warning: LIMIT or OFFSET not valid');
        }
    }
};

var buildSqlGroupBy = function (query, groupBy) {
    if (groupBy.length > 0) {
        query.sql += dictionary.group_by;
        query.sql += groupBy.toString();
    }
};

module.exports = Adapter;
