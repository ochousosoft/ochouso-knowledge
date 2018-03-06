var app = require('../../server');
var officegen = require('officegen');
var PdfPrinter = require('pdfmake');
var fs = require('fs');
var path = require('path');
var pdf = require('html-pdf');
var DataModel = require('./datamodel');
var env = require("../../config/env");
var mode = app.get('env');
var ejs = require('ejs');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var moment = require('moment');
var Promise = require('bluebird');
Promise.config({
    longStackTraces: true
});
var logger = require("../../config/logger");
var conversion = require("phantom-html-to-pdf")({host: env[mode].host, port: env[mode].port});

var mp = function (relFontPath) {
    return path.resolve(__dirname, relFontPath);
};

var fonts = {
    Roboto: {
        normal: mp('./fonts/Roboto-Regular.ttf'),
        bold: mp('./fonts/Roboto-Medium.ttf'),
        italics: mp('./fonts/Roboto-Italic.ttf'),
        bolditalics: mp('./fonts/Roboto-MediumItalic.ttf')
    }
};

exports.xlsx = function (req, res, callback) {

    res.writeHead(200, {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        'Content-disposition': 'attachment; filename=' + req.body.filename
    });

    var xlsx = officegen('xlsx');

    xlsx.on('finalize', function (written) {
        logger.info('Finish to create an Excel file.\nTotal bytes created: ' + written + '\n');
    });

    xlsx.on('error', function (err) {
        logger.err(err);
    });

    var sheet = xlsx.makeNewSheet();

    sheet.name = req.body.title;

    var data = req.body.data;
    var columns = req.body.columns;

    sheet.data[0] = [];

    for (var i = 0; i < columns.length; i++) {
        var column = columns[i];
        sheet.data[0][i] = column.deno.toUpperCase();
    }

    for (var i = 0; i < data.length; i++) {
        var record = data[i];
        sheet.data[i + 1] = [];
        for (var j = 0; j < columns.length; j++) {
            try {
                var recordValue = '';
                if ((record[columns[j].column] instanceof Date && !isNaN(record[columns[j].column].valueOf())) || record[columns[j].column] === null) {
                    recordValue = (record[columns[j].column] === null) ? ' ' : record[columns[j].column];
                }
                else {
                    if (typeof record[columns[j].column] !== 'number' && !isNaN(record[columns[j].column]) && isNaN(parseInt(record[columns[j].column]))) {
                        recordValue = new Date(record[columns[j].column]);
                    }
                }
                if (recordValue instanceof Date && !isNaN(recordValue.valueOf())) {
                    // recordValue = recordValue.getDate() + '/' + recordValue.getMonth() + '/' + recordValue.getFullYear() + ' ' + recordValue.getHours() + ':' + recordValue.getMinutes();
                    recordValue = moment(recordValue).format('DD/MM/YYYY HH:mm');
                    sheet.data[i + 1][j] = recordValue;
                }
                else {
                    sheet.data[i + 1][j] = (record[columns[j].column] === null) ? ' ' : record[columns[j].column];
                }
            } catch (err) {
                sheet.data[i + 1][j] = record[columns[j].column];
            }
        }
    }
    xlsx.generate(res);
};

exports.pdf = function (data, res) {
    conversion(data.template, function (err, pdf) {
        pdf.stream.pipe(res);
    });
};

exports.buildPdf = function (data, dir) {
    return new Promise(function (resolve, reject) {
        conversion(data.template, function (err, pdf) {
            if (err) {
                reject(err);
            } else {
                resolve(pdf);
            }
        });
    })
};

exports.tablePdf = function (req, res) {
    res.writeHead(200, {
        "Content-Type": "application/pdf",
        'Content-disposition': 'attachment; filename=' + req.body.filename
    });

    var data = req.body.data;
    var columns = req.body.columns;

    var headerTable = [];
    for (var i = 0; i < columns.length; i++) {
        var column = columns[i];
        var col = {
            'text': column.deno.toUpperCase(),
            'style': 'tableHeader'
        };
        headerTable.push(col);
    }

    var bodyTable = [];
    bodyTable.push(headerTable);

    for (var i = 0; i < data.length; i++) {
        var record = data[i];
        var row = [];
        for (var j = 0; j < columns.length; j++) {
            try {
                var recordValue = '';
                if (record[columns[j].column] instanceof Date && !isNaN(record[columns[j].column].valueOf())) {
                    recordValue = record[columns[j].column];
                }
                // else{
                //   if(typeof record[columns[j].column] !== 'number'){
                //     recordValue = new Date(record[columns[j].column]);
                //   }
                // }
                if (recordValue instanceof Date && !isNaN(recordValue.valueOf())) {
                    recordValue = recordValue.getDate() + '/' + recordValue.getMonth() + '/' + recordValue.getFullYear() + ' ' + recordValue.getHours() + ':' + recordValue.getMinutes();
                    row.push(recordValue);
                }
                else {
                    row.push(record[columns[j].column] != null ? record[columns[j].column].toString() : '');
                }
            } catch (err) {
                row.push(record[columns[j].column] != null ? record[columns[j].column].toString() : '');
            }
        }
        bodyTable.push(row);
    }


    var printer = new PdfPrinter(fonts);
    var docDefinition = {};

    if (req.body.template.dir === 'default') {
        docDefinition = {
            content: [
                {text: req.body.title, style: 'header'},
                {text: req.body.template.preTable != undefined ? req.body.template.preTable : '', style: 'paragraph'},
                {
                    style: 'tableExample',
                    table: {
                        headerRows: 1,
                        body: bodyTable
                    },
                    layout: 'lightHorizontalLines'
                },
                {text: req.body.template.postTable != undefined ? req.body.template.postTable : '', style: 'paragraph'},
            ],
            styles: {
                header: {
                    fontSize: 18,
                    bold: true,
                    margin: [0, 0, 0, 10]
                },
                subheader: {
                    fontSize: 16,
                    bold: true,
                    margin: [0, 10, 0, 5]
                },
                tableExample: {
                    margin: [0, 5, 0, 15],
                    color: 'black'
                },
                tableHeader: {
                    bold: true,
                    fontSize: 13,
                    color: 'black'
                },
                paragraph: {
                    fontSize: 13,
                    color: 'black',
                    alignment: 'justify'
                }
            },
            defaultStyle: {
                // alignment: 'justify'
            }
        };

        var pdfDoc = printer.createPdfKitDocument(docDefinition);
        pdfDoc.pipe(res);
        pdfDoc.end();
    }
    else {
        //TODO template personalizada
        var html = req.body.template.html;
        if (!html) {
            html = fs.readFileSync('./resources/' + req.body.template.dir, 'utf8');
        }

        for (key in req.body.template.dictionary) {
            html = html.replace(key, req.body.template.dictionary[key]);
        }

        var options_pdf = {filename: req.body.filename, format: 'A4'};
        pdf.create(html, options_pdf).toStream(function (err, stream) {
            logger.error(err, stream);
            if (err) return logger.err(err);
            stream.pipe(res);
        });
    }
};

exports.file = function (req, res) {

    var data = req.body.data;
    if (req.body.columns) {
        var columns = req.body.columns;
    }
    var fileString = '';
    if (req.body.template && (req.body.template.dir !== 'default' || req.body.template.template_string !== '')) {
        var template_string = '';
        template_string = req.body.template.template_string;
        if (req.body.template.dir && req.body.template.dir !== 'default') {
            template_string = fs.readFileSync('./resources/' + req.body.template.dir, 'utf8');
        }
        for (key in req.body.template.dictionary) {
            template_string = template_string.replace(key, req.body.template.dictionary[key]);
        }
        fileString = template_string;

    } else {
        if (req.body.columns && req.body.columns.length > 0) { //Si desde el cliente pasamos columnas crea una estructura en el documento tal que -->  columna : valor.
            for (var i = 0; i < data.length; i++) {
                for (var j = 0; j < columns.length; j++) {
                    if (j === columns.length - 1) {
                        fileString += columns[j].deno + ':' + data[i][columns[j].column] + '; \n';
                    }
                    else {
                        fileString += columns[j].deno + ':' + data[i][columns[j].column] + '; ';
                    }
                }
            }
        } else { //Si no pasamos columnas es que ya pasamos directamente un string que queremos pasar a un documento.
            fileString = data;
        }
    }

    fs.writeFile('./tmp/' + req.body.filename, fileString, function (err) {
        if (err) {
            throw err;
        }
        else {
            logger.info('It\'s saved!');
            fs.readFile('./tmp/' + req.body.filename, 'utf8', function (err, result) {
                if (err) throw err;
                res.send(result);
            });
        }
    });
};
/**
 * Estructura de datos que debe recibir
 * var params = {};
 * params.data = {};
 * params.data.contacts = $scope.listado;
 * params.data.subject = 'Colegio de Fisioterapeutas de Islas Baleares';
 * params.data.template = {
 *   "dir":'default',
 *   "##content##":$scope.plantilla.contenido,
 *   "##bgcolor##":"#DE6F01",
 *   "##logo_url##":"'http://i.imgur.com/sUagJx4.jpg'"
 * };
 */

exports.emails = function (data, res, callback) {
    //TODO Añadir atachments

    ejs.open = '{{';
    ejs.close = '}}';
    var infoMessage = {};

    var email_template = '';
    if (data.template.dir === 'default') {
        email_template = process.cwd() + '/resources/email_template.ejs';
    }
    else {
        email_template = process.cwd() + data.template.dir;
    }

    var from = "";
    var failedSents = [];
    if (data.smtpParams) {
        from = data.smtpParams.username;
        var transporter = nodemailer.createTransport(smtpTransport({
            host: data.smtpParams.host,
            port: data.smtpParams.port,
            auth: {
                user: data.smtpParams.username,
                pass: data.smtpParams.password
            },
            ignoreTLS: true
        }));
    }
    else {
        from = env[mode].nodemailer_user;
        var transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: env[mode].nodemailer_user,
                pass: env[mode].nodemailer_pass
            }
        });
    }
    var promises = [];
    for (var i = 0; i < data.contacts.length; i++) {
        var contact = data.contacts[i];
        var toSend = function (transporter, contact, failedSents) {
            var contact = contact;
            return readEmail(email_template, data).then(function (html) {
                mailOptions = {
                    from: from,
                    to: contact.email, // list of receivers
                    subject: data.subject, // Subject line
                    html: html // html body
                };
                return sendEmail(transporter, mailOptions, failedSents);
            });
        }(transporter, contact, failedSents);
    }
    ;
    promises.push(toSend);

    Promise.all(promises).then(function (response) {
        var datamodel = new DataModel();
        datamodel.code = 200;
        datamodel.msg = 'Emails had been sent';
        datamodel.failedSents = failedSents;
        res.json(datamodel);
    }).catch(function (err) {
        var datamodel = new DataModel();
        datamodel.code = 400;
        datamodel.msg = err;
        res.json(datamodel);
    });

};

function sendEmail(transporter, mailOptions, failedSents) {
    return new Promise(function (resolve, reject) {
        transporter.sendMail(mailOptions, function (error, info) {
            var infoMessage = {};
            if (error) {
                logger.err(error);
                infoMessage.msg = error;
                infoMessage.code = 400;
                failedSents.push(mailOptions.to);
            } else {
                logger.info('Message sent: ' + info.response);
                infoMessage.msg = info.response;
                infoMessage.code = 200;
            }
            resolve(infoMessage);
        });
    })
}

function readEmail(email_template, data) {
    return new Promise(function (resolve, reject) {
        fs.readFile(email_template, 'utf8', function (err, file) {
            if (err) reject(err);
            var content = this.content;
            var html = ejs.render(file, content);
            for (key in data.template) {
                html = html.replace(key, data.template[key]);
            }
            resolve(html);
        });
    });
}
