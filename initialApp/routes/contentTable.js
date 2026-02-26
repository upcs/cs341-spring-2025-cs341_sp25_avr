//created by Tramanh

var express = require('express');
var router = express.Router();
var dbms = require("./dbms");
const db = require("./dbms_promise");


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

// Safe, fixed query for sample content used by the Vite app
router.get('/sample', async function (req, res) {
    const rawLimit = parseInt(req.query.limit, 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 10) : 3;

    try {
        const query = `
            SELECT buildingName, year, description
            FROM Content
            ORDER BY year DESC
            LIMIT ${limit};
        `;
        const results = await db.dbquery(query);
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: "Failed to load sample content" });
    }
});
module.exports = router;
