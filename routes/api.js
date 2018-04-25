const express = require('express');
const async = require('async');
const data = require('../services/data');

const router = express.Router({});
const LIMIT = 10;

router.get('/api/get-location', function (req, res) {
    let ip = req.query.ip;
    if (!ip)
        ip = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'][0] : null || req.connection.remoteAddress;

    data.getIpLocation(ip)
        .then((result) => {
            res.send(result);
        })
        .catch(error => {
            res.status(500);
            res.send(error);
        });
});

router.get('/api/get-region', function (req, res) {
    let malwareName = req.query.name;

    data.getTopRegion(LIMIT, malwareName)
        .then(value => {
            res.send(value);
        })
        .catch(error => {
            res.status(500);
            res.send(error);
        });
});

router.get('/api/get-malware-region', function (req, res) {
    let countryCode = req.query.countryCode;
    let regionCode = req.query.regionCode;

    data.getTopMalware(LIMIT, countryCode, regionCode)
        .then(value => {
            res.send(value);
        })
        .catch(error => {
            res.status(500);
            res.send(error);
        });
});

router.get('/api/get-malware-remote', function (req, res) {
    let remoteHost = req.query.remoteHost;

    data.getTopMalware(LIMIT, null, null, remoteHost)
        .then(value => {
            res.send(value);
        })
        .catch(error => {
            res.status(500);
            res.send(error);
        });
});

module.exports = router;