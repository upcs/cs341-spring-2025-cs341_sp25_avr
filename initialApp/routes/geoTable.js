//created by Tramanh
//Edited by Emma Jeppesen

var express = require('express');
var router = express.Router();
const db = require("./dbms_promise");
var mysql = require('mysql');

// Endpoint to get coordinates for all buildings
router.get('/coordinates', async (req, res) => {
    try {
      const query = 'SELECT * FROM Geo';  
      const result = await db.dbquery(query); 
  
       //Map the result into a structured response
       const coordinates = result.map(row => ({
        name: row.buildingName,
        latMin: row.latMin,
        latMax: row.latMax,
        longMin: row.longMin,
        longMax: row.longMax
    }));

        //Return the coordinates as a JSON response
        res.json(coordinates);

    } catch (err) {

    console.error('Error querying database:', err);
    res.status(500).json({ error: 'Failed to retrieve coordinates' });
  
    }

});

//Idea for future and putting in new buildings
//POST route to add building coordinates
router.post('/addBuilding', async (req, res) => {
    const { buildingName, latMax, latMin, longMax, longMin } = req.body || {};

    if (!buildingName || [latMax, latMin, longMax, longMin].some((value) => value === undefined || value === null || value === '')) {
      return res.status(400).json({ error: 'buildingName, latMax, latMin, longMax, and longMin are required' });
    }

    const safeLatMax = Number(latMax);
    const safeLatMin = Number(latMin);
    const safeLongMax = Number(longMax);
    const safeLongMin = Number(longMin);

    if (![safeLatMax, safeLatMin, safeLongMax, safeLongMin].every(Number.isFinite)) {
      return res.status(400).json({ error: 'Coordinates must be valid numbers' });
    }

    const query = `
    INSERT INTO Geo (buildingName, latMax, latMin, longMax, longMin)
    VALUES (${mysql.escape(String(buildingName))},
            ${mysql.escape(safeLatMax)},
            ${mysql.escape(safeLatMin)},
            ${mysql.escape(safeLongMax)},
            ${mysql.escape(safeLongMin)})
    `;

    try {
      await db.dbquery(query);
      res.status(200).json({ message: 'Building added successfully!' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to add building' });
    }
  });

module.exports = router;
