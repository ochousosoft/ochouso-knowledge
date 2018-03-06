var app = require('../../server');
var DataModel = require('./datamodel');
var authorization = require('../security/authorization');
var domParser = new(require('xmldom')).DOMParser;

exports.getDataSource = function(model) {
    return model.datasource;
};

exports.getIdByEjercicio = function(dc_empresas, ejercicio) {
    var id;
    for (var key in dc_empresas) {
        if (dc_empresas[key].ejercicio == ejercicio) {
            id = key;
            break;
        }
    }
    return id;
};

exports.getAdapter = function(model) {
    var datasourceId = model.datasource;
    var datasources = app.get('datasources');
    return datasources[datasourceId].adapter;
};

exports.generatePassword = function(string_length) {
    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
    var randomstring = '';
    for (var i = 0; i < string_length; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        randomstring += chars.substring(rnum, rnum + 1);
    }
    return randomstring;
};


exports.getAdapterById = function(id) {
    return datasources[id].adapter;
};

exports.getAdapterByDatasource = function(datasourceId) {
    var datasources = app.get('datasources');
    return datasources[datasourceId].adapter;
};

exports.isArray = function(o) {
    return Object.prototype.toString.call(o) === '[object Array]';
};

exports.isObject = function(o) {
    return Object.prototype.toString.call(o) === '[object Object]';
};

exports.isString = function(o) {
    return (typeof o === 'string');
};

exports.parenthesize = function(o) {
    return ' (' + o + ') ';
};

exports.bracketsize = function(o) {
    return ' [' + o + '] ';
};

exports.sortArrayOfObjectByNumber = function(array, property) {
    array.sort(function(a, b) {
        return a[property] - b[property]
    })
    return array;
};

exports.sortArrayOfObjectByString = function(array, property) {
    array.sort(function(a, b) {
        var nameA = a[property].toLowerCase(),
            nameB = b[property].toLowerCase()
        if (nameA < nameB) //sort string ascending
            return -1
        if (nameA > nameB)
            return 1
        return 0 //default return value (no sorting)
    })
    return array;
};

exports.sortArrayOfObjectByDate = function(array, property) {
    array.sort(function(a, b) {
        var dateA = new Date(a[property]),
            dateB = new Date(b[property])
        return dateA - dateB //sort by date ascending
    })
    return array;
};

exports.extractReqParams = function(req) {
    var allowed = ['select', 'where', 'limit', 'page', 'group_by', 'order_by', 'projection', 'globalFilters', 'data'];
    var params = {};
    for (var i = 0; i < allowed.length; i++) {
        if (req.query[allowed[i]]) {
            if (allowed[i] == 'data') {
                params[allowed[i]] = JSON.parse(req.query[allowed[i]]);
            } else {
                params[allowed[i]] = req.query[allowed[i]];
            }
        }
    }
    return params;
};

exports.generateExternalIdCode = function(letter, id) {
    var digits = 15;
    var code = letter;
    var numString = pad(id, digits);
    code = code.concat(numString);
    return code;
};

exports.buildBulkObject = function(object) {
    if (Object.keys(object).length) {
        var arrayLength = object[Object.keys(object)[0]].length;
        var result = {};
        result.values = [];
        result.columns = Object.keys(object);
        result.numColumns = result.columns.length;
        result.parameters = "";
        for (var i = 0; i < arrayLength; i++) {
            for (property in object) {
                result.values.push(object[property][i]);
            }
            result.parameters += this.parenthesize(this.dollarizeArray$(result.numColumns, (i * result.numColumns)).toString());
            if (i < arrayLength - 1) {
                result.parameters += ",";
            }
        }
        return result;
    } else {
        return false;
    }
}

exports.extractRelationatedTables = function(reqBodyParams, model) {
    var allowed = [];
    var relationatedTables = {};
    if (!reqBodyParams.hasOwnProperty('projection')) {
        reqBodyParams['projection'] = 'default';
    }
    var oneToN = model.projections[reqBodyParams['projection']].oneToN;
    for (var i = 0; i < oneToN.length; i++) {
        relationatedTables[oneToN[i].model] = reqBodyParams.data[oneToN[i].find.column];
        delete reqBodyParams.data[oneToN[i].find.column];
    }
    return relationatedTables;
};


//busca si las que keys de un objecto son columnas y las sustitulle por nombre de vista o tabla + columna correspondiente.
//Si es texto entra por el catch y se opera sobre el del mismo modo.
exports.changeRelationatedColumns = function(reqParams, model, property) {
    if (exports.isString(reqParams[property])) {
        try {
            var item = JSON.parse(reqParams[property]);
        } catch (e) {
            var item = reqParams[property];
        }
    } else {
        var item = reqParams[property];
    }
    return hascolumns(item, model, reqParams);
};

function hasFindColumn(find, key) {
    if (find) {
        for (var i = 0; i < find.length; i++) {
            if (find[i] === key) {
                return true;
            }
        }
    }
    return false;
}

function hascolumns(item, model, reqParams, destino) {
    var newName;
    if (!destino) {
        var destino = JSON.parse(JSON.stringify(item));
    }
    if (exports.isObject(item)) {
        for (var key in item) {
            if (model.columns[key] || hasFindColumn(model.projections[reqParams.projection].find, key)) {
                var value = item[key];
                delete destino[key];
                newName = model.projections[reqParams.projection].from + '.' + key;
                destino[newName] = value;
            } else {
                if (model.projections[reqParams.projection].fk) {
                    var fks = model.projections[reqParams.projection].fk;
                    for (var i = 0; i < fks.length; i++) {
                        for (var j = 0; j < fks[i].find.length; j++) {
                            if (fks[i].find[j].alias == key) {
                                if (fks[i].alias) {
                                    var value = item[key];
                                    delete destino[key];
                                    newName = fks[i].alias + '.' + fks[i].find[j].column;
                                    destino[newName] = value;
                                } else {
                                    var value = item[key];
                                    delete destino[key];
                                    var modelR = require('../../models/' + fks[i].modelFK);
                                    newName = modelR.table + '.' + fks[i].find[j].column;
                                    destino[newName] = value;
                                }
                            }
                        }
                    }
                }
            }
            if (exports.isObject(item[key]) || exports.isArray(item[key])) {
                hascolumns(item[key], model, reqParams, destino[key]);
            }
        }
        return destino;
    } else if (exports.isArray(item)) {
        if (exports.isString(item[0])) {
            for (var i = 0; i < item.length; i++) {
                if (model.columns[item[i]] || (model.projections[reqParams.projection] && hasFindColumn(model.projections[reqParams.projection].find, item[i]))) {
                    if (model.projections[reqParams.projection]) {
                        destino[i] = model.projections[reqParams.projection].from + '.' + item[i];
                    } else {
                        destino[i] = model.table + '.' + item[i];
                    }
                }
            }
            return destino;
        } else {
            for (var i = 0; i < item.length; i++) {
                hascolumns(item[i], model, reqParams, destino[i]);
            }
        }
    } else {
        if (model.columns[item] || (model.projections[reqParams.projection] && hasFindColumn(model.projections[reqParams.projection].find, item))) {
            if (model.projections[reqParams.projection]) {
                destino = model.projections[reqParams.projection].from + '.' + item;
            } else {
                destino = model.table + '.' + item;
            }
            return destino;
        }
    }
}

exports.dollarize$ = function(i) {
    return '$' + i;
};

exports.dollarizeArray$ = function(length, start = 0) {
    var $array = [];
    for (var i = start; i < length + start; i++) {
        var value = '$' + (i + 1);
        $array.push(value);
    }
    return $array;
};

exports.qualify = function(str) {
    return "'" + str + "'";
};

exports.getQuery = function(adapter, query, callback) {
    var parameters = {};
    parameters.sql = query;
    parameters.values = [];
    adapter.execsql(parameters, function(result) {
        callback(result);
    });
};

exports.whereToString = function(queryW) {
    var whereString = queryW.sql;
    for (var i = 0; i < queryW.values; i++) {
        whereString = whereString.replace('$' + (i + 1), queryW.values[i]);
    }
    return whereString;
};

exports.replaceAll = function(string, search, replacement) {
    var target = string;
    return target.replace(new RegExp(search, 'g'), replacement);
};

exports.cleanString = function(str) {
    var res = "";
    for (var i = 0; i < str.length; i++) {
        if (str.charCodeAt(i) != 0 && str.charCodeAt(i) != 65533) {
            res += str[i];
        }
    }
    return res;
}

exports.incrementMaxVal = function(max) {
    if (typeof max == 'string') {
        var num_digits = max.length;
        max = parseInt(max) + 1;
        return pad(max, num_digits);
    }
    if (typeof max == 'number') {
        return max + 1;
    }
};

function pad(str, max) {
    str = str.toString();
    return str.length < max ? pad("0" + str, max) : str;
}

exports.zeroPad = function(str, max) {
    return pad(str, max);
};

exports.accessGranted = function(req, res) {
    var datamodel = new DataModel();
    var access = false;
    var authData = authorization.decodeAuthToken(req, res);
    var user_companies = authData.data.companies;

    if (JSON.parse(req.query.where).$and[0].company_code) {
        access = checkContains(user_companies, JSON.parse(req.query.where).$and[0].company_code);
    } else {
        access = checkContains(user_companies, JSON.parse(req.query.where).$and[0][Object.keys(JSON.parse(req.query.where).$and[0])[0]]);
    }

    if (!access) {
        datamodel.code = 401;
        datamodel.msg = 'ERROR: ' + 'Unauthorized';
        datamodel.result.data = [];
        res.json(datamodel);
        return false;
    } else {
        return true;
    }
};

exports.accessGrantedInArray = function functionName(arrayCheck, arrayToTest, propertyArray, propertyCheck, res) {
    for (var i = 0; i < arrayCheck.length; i++) {
        if (!exports.customAccessGranted(arrayCheck[i], arrayToTest, propertyArray, propertyCheck, res)) {
            return false;
        }
    }
    return true;
}

exports.customAccessGranted = function(where, arrayToTest, propertyArray, propertyFindedWhere, res) {
    try {
        var where = JSON.parse(where);
    } catch (e) {

    }
    var datamodel = new DataModel();
    var access = false;
    if (!where.$and) {
        for (var i = 0; i < arrayToTest.length; i++) {
            if (arrayToTest[i][propertyArray] == where[propertyFindedWhere]) {
                access = true;
            }
        }
    } else {
        for (var i = 0; i < arrayToTest.length; i++) {
            for (var j = 0; j < where.$and.length; j++) {
                if (arrayToTest[i][propertyArray] == where.$and[j][propertyFindedWhere]) {
                    access = true;
                }
            }
        }
    }

    if (!access) {
        datamodel.code = 401;
        datamodel.msg = 'ERROR: ' + 'Unauthorized';
        datamodel.result.data = [];
        res.json(datamodel);
        return false;
    } else {
        return true;
    }
};

function checkContains(own, check) {
    var contain = false;
    for (var i = 0; i < own.length; i++) {
        if (own[i].id == check) {
            contain = true;
        }
    }
    return contain;
}

exports.removeArrayItem = function(arr, pos) {
    return pos > -1 ? arr.splice(pos, 1) : [];
};
exports.filterArrayOfObjectsByProperty = function(array, property, value) {
    var filteredItems = [];
    for (var i = 0; i < array.length; i++) {
        if (array[i][property] == value) {
            filteredItems.push(array[i]);
        }
    }
    return filteredItems;
}

exports.objectize = function(stringValue, type, qualify) {
    if (stringValue == undefined || stringValue == null) {
        //avoid problems
        return null;
    }
    switch (type) {
        case 'string':
            if (qualify) {
                stringValue = stringValue.toString();
                stringValue = stringValue.replace(/'/g, "");
                return "'" + stringValue + "'";
            } else {
                return stringValue;
            }
        case 'integer':
            try {
                return parseInt(stringValue);
            } catch (e) {
                return null;
            }
        case 'float':
            try {
                return parseFloat(stringValue);
            } catch (e) {
                return null;
            }
        case 'date':
            try {
                arrDateTokens = stringValue.split('/');
                var day = (arrDateTokens[0].length == 1) ? ('0' + arrDateTokens[0]) : arrDateTokens[0];
                var month = (arrDateTokens[1].length == 1) ? ('0' + arrDateTokens[1]) : arrDateTokens[1];
                var year = arrDateTokens[2];
                return new Date(year, month - 1, day);
            } catch (e) {
                return null;
            }
            // Convertir fecha desde aplicacion android en formato: Fri Jun 21 00:00:00 UTC+0100 2013
        case 'dateTime':
            try {
                var year = stringValue.slice(-4),
                    month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                    ].indexOf(stringValue.substr(4, 3)) + 1,
                    day = stringValue.substr(8, 2);

                var output = year + '-' + (month < 10 ? '0' : '') + month + '-' + day;
                return output;
            } catch (e) {
                return null;
            }
        case 'object':
            try {
                return JSON.parse(stringValue);
            } catch (e) {
                return null;
            }
        case 'timestamp':
            try {
                if ((new Date(stringValue)).getTime() > 0) {
                    return stringValue;
                } else {
                    return null;
                }
            } catch (e) {
                return null;
            }
        default:
            return stringValue;
    }
}

exports.prefixZeros = function(number, maxDigits) {
        var length = maxDigits - number.toString().length;
        if (length <= 0)
            return number.toString();

        var leadingZeros = new Array(length + 1);
        return leadingZeros.join('0') + number.toString();
    }
    //For use here
function prefixZeros(number, maxDigits) {
    var length = maxDigits - number.toString().length;
    if (length <= 0)
        return number;

    var leadingZeros = new Array(length + 1);
    return leadingZeros.join('0') + number.toString();
}

exports.getWeek = function(start) {
    //Calcing the starting point
    start = start || 0;
    var today = new Date();
    today.setHours(0);
    var day = today.getDay() - start;

    // Grabbing Start/End Dates
    StartDate = new Date(today.getTime() - 60 * 60 * 24 * day * 1000);
    EndDate = new Date(StartDate.getTime() + 60 * 60 * 24 * 6 * 1000);
    return [prefixZeros(StartDate.getFullYear(), 4) + '-' + prefixZeros(StartDate.getMonth() + 1, 2) + '-' + prefixZeros(StartDate.getDate(), 2), prefixZeros(EndDate.getFullYear(), 4) + '-' + prefixZeros(EndDate.getMonth() + 1, 2) + '-' + prefixZeros(EndDate.getDate(), 2)];
}

exports.getMonth = function(month, year) {
    nextMonth = month + 1;
    StartDate = new Date(year, month, 1);
    EndDate = new Date(year, nextMonth, 0);
    return [prefixZeros(StartDate.getFullYear(), 4) + '-' + prefixZeros(StartDate.getMonth() + 1, 2) + '-' + prefixZeros(StartDate.getDate(), 2), prefixZeros(EndDate.getFullYear(), 4) + '-' + prefixZeros(EndDate.getMonth() + 1, 2) + '-' + prefixZeros(EndDate.getDate(), 2)];
}

exports.getYear = function(year) {
    StartDate = new Date(year, 0, 1);
    EndDate = new Date(year, 11, 31);
    return [prefixZeros(StartDate.getFullYear(), 4) + '-' + prefixZeros(StartDate.getMonth() + 1, 2) + '-' + prefixZeros(StartDate.getDate(), 2), prefixZeros(EndDate.getFullYear(), 4) + '-' + prefixZeros(EndDate.getMonth() + 1, 2) + '-' + prefixZeros(EndDate.getDate(), 2)];
}

exports.isEmpty = function(val) {
    return (val === undefined || val == null || val.length <= 0) ? true : false;
}


exports.getFinalData = function(objToTranspose) {
    let finalData = [];
    if (Object.keys(objToTranspose).length > 0) {
        let arrLength = objToTranspose[Object.keys(objToTranspose)[0]].length;
        for (let i = 0; i < arrLength; i++) {
            let finalObject = {};
            for (let j = 0; j < Object.keys(objToTranspose).length; j++) {
                finalObject[Object.keys(objToTranspose)[j]] = objToTranspose[Object.keys(objToTranspose)[j]][i];
            }
            finalData.push(finalObject);
        }
    }
    return finalData;
};

exports.convertXML = (xml) => {
    return domParser.parseFromString(xml).documentElement;
}

exports.findElements = (element, xml) => {
    let output = [];
    let nodes = xml.childNodes;
    if (nodes != null) {
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeName == element) {
                output.push(nodes[i].childNodes);
            } else {
                output = output.concat(this.findElements(element, nodes[i]));
            }
        }
    }
    return output;
}

exports.findValue = (element, tag) => {
    let value = "";
    for (let i in element) {
        if (element[i].nodeName == tag && element[i].childNodes.length == 1) {
            value = element[i].childNodes[0].nodeValue;
            break;
        } else {
            value = value + this.findValue(element[i].childNodes, tag);
        }
    }
    return value;
}

exports.getOptions = (passwd, cert, xml, url) => {
    let options = {
        uri: url,
        method: "POST",
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        agentOptions: {
            pfx: Buffer.from(cert, 'base64'),
            passphrase: passwd,
            securityOptions: 'SSL_OP_NO_SSLv3'
        },
        body: xml
    };

    return options;
}

exports.getResponse = (infoXml, id_record, accionStr) => {
    let response = {};
    let ids = [];
    let accion = [];
    let finalData = {};
    let parametersBulkTrack = {};
    if (infoXml.length > 0) {
        let ids = [];
        let csvs = [];
        let estados = [];
        let numsSerie = [];
        let acciones = [];
        for (let i = 0; i < infoXml.length; i++) {
            ids.push(id_record);
            csvs.push(infoXml[i].csv);
            estados.push(infoXml[i].estado);
            numsSerie.push(infoXml[i].numSerie);
            acciones.push(accionStr);
        }
        parametersBulkTrack = {
            data: {
                id_record: ids,
                csv: csvs,
                num_serie_fact: numsSerie,
                estado_registro: estados,
                accion: acciones
            }
        }
    } else {
        parametersBulkTrack = {
            data: {
                id_record: [id_record],
                csv: [""],
                num_serie_fact: [""],
                estado_registro: ["Sin datos"],
                accion: [accionStr]
            }
        }
    }
    response.parametersBulkTrack = parametersBulkTrack;

    return response;
}