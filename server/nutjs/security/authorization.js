var app = require('../../server');
var jwt = require('jsonwebtoken');  //https://npmjs.org/package/node-jsonwebtoken
//secret string to create tokens
/*var secret = require('../../config/secret');

exports.decodeAuthToken = function (req, res) {
    if (req.headers.authorization) {
        var token = req.headers.authorization.split(' ')[1];
        try {
            var decoded = jwt.decode(token, secret);
            return decoded;
            // if (decoded.exp <= Date.now()) {
            //   res.status(400);
            //   res.json('Access token has expired');
            // } else {
            //   return decoded;
            // }
        } catch (err) {
            res.status(500);
            res.json('Error parsing security token');
        }
    } else {
        res.status(440);
        res.send('Invalid token access');
    }
};*/
