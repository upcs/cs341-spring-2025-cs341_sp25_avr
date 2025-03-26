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
router.post('/addBuilding', (req, res) => {
    const { buildingName, latMax, latMin, longMax, longMin } = req.body;
  
    //SQL query to insert the building data into the Geo table
    const query = `
    INSERT INTO Geo (buildingName, latMax, latMin, longMax, longMin)
    VALUES (?, ?, ?, ?, ?)
    `;
    
    db.query(query, [name, latitude, longitude, latMin, latMax, longMin, longMax], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to add building' });
      }
      res.status(200).json({ message: 'Building added successfully!' });
    });
  });

module.exports = router;
