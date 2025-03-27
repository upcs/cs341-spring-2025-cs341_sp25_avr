//created by Tramanh

var express = require('express');
var router = express.Router();
var dbms = require("./dbms");


router.post('/', function (req, res, next) {
    
    const dbRequest = req.body.dbRequest
    //`SELECT * FROM Geo where buildingName=${buildingName};`


    dbms.dbquery(`${dbRequest}`, function (error, results) {
        if (error) {
            res.status(500).json({ message: "things went bad :(" })
        } else {
            res.json(results)
        }
    })

});
module.exports = router;
