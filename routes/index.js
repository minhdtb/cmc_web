const express = require('express');
const async = require('async');
const data = require('../services/data');

const router = express.Router({});
const LIMIT = 10;

router.get('/', function (req, res) {
    async.parallel({
        topMalware: (callback) => {
            data.getTopMalware(LIMIT)
                .then(value => {
                    callback(null, value);
                })
                .catch((error) => {
                    callback(error);
                });
        },
        topRegion: (callback) => {
            data.getTopRegion(LIMIT)
                .then(value => {
                    callback(null, value);
                })
                .catch((error) => {
                    callback(error);
                });
        },
        topRemote: (callback) => {
            data.getTopRemote(LIMIT)
                .then(value => {
                    callback(null, value);
                })
                .catch((error) => {
                    callback(error);
                })
        }
    }, function (error, result) {
        if (error) {
            res.status(500);
            return res.send('Error: Internal server error.');
        }

        res.render('index', result);
    });
});

router.get('/report', function (req, res) {
    async.parallel({
        malwares: (callback) => {
            data.getTopMalware(0)
                .then(value => {
                    callback(null, value);
                })
                .catch((error) => {
                    callback(error);
                });
        },
        regions: (callback) => {
            data.getTopRegion(0)
                .then(value => {
                    callback(null, value);
                })
                .catch((error) => {
                    callback(error);
                });
        },
        remotes: (callback) => {
            data.getTopRemote(0)
                .then(value => {
                    callback(null, value);
                })
                .catch((error) => {
                    callback(error);
                });
        }
    }, function (error, result) {
        if (error) {
            res.status(500);
            return res.send('Error: Internal server error.');
        }

        res.render('report', result);
    });
});

module.exports = router;
