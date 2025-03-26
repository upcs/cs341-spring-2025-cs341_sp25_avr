//created by Tramanh

var express = require('express');
var router = express.Router();
var dbms = require("./dbms");

router.post('/', function (req, res, next) {

    const buildingName = req.body.buildingName;

    if (!buildingName) {
        return res.status(400).json({ message: "Missing building name" });
    }

    const dbRequest = req.body.dbRequest
    const query = `SELECT * FROM contentTable WHERE buildingName = '${buildingName}'`;



    dbms.dbquery(`${dbRequest}`, function (error, results) {
        if (error) {
            res.status(500).json({ message: "Database query failed" });
        } else if (results.length === 0) {
            res.status(404).json({ message: "No data found for this building" });
        } else {
            res.json(results);
        }
    });
});
module.exports = router;
