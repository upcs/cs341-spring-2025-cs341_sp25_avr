//created by Tramanh

var express = require('express');
var router = express.Router();
var dbms = require("./dbms");
const db = require("./dbms_promise");
var mysql = require('mysql');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (_req, _file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (_req, file, cb) {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        const stamp = Date.now();
        cb(null, `${stamp}_${safeName}`);
    },
});

const upload = multer({ storage });


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

// Timeline entries for a specific building
router.get('/by-building', async function (req, res) {
    const buildingName = req.query.buildingName ? String(req.query.buildingName) : null;
    if (!buildingName) {
        res.status(400).json({ message: "buildingName is required" });
        return;
    }

    const query = `
        SELECT buildingName, year, description, imagePath
        FROM Content
        WHERE buildingName = ${mysql.escape(buildingName)}
        ORDER BY year ASC;
    `;

    try {
        const results = await db.dbquery(query);
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: "Failed to load building timeline" });
    }
});

// Photos from database (optionally filtered by buildingName)
router.get('/photos', async function (req, res) {
    const rawLimit = parseInt(req.query.limit, 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 20) : 6;
    const buildingName = req.query.buildingName ? String(req.query.buildingName) : null;

    const whereClause = buildingName ? `WHERE buildingName = ${mysql.escape(buildingName)}` : '';
    const query = `
        SELECT buildingName, year, imageUrl, caption
        FROM Photos
        ${whereClause}
        ORDER BY year DESC
        LIMIT ${limit};
    `;

    try {
        const results = await db.dbquery(query);
        const normalized = (results || []).map((row) => {
            let imageUrl = row.imageUrl || '';
            imageUrl = imageUrl.replace(/\\/g, '/');
            imageUrl = imageUrl.replace(/^\/?initialApp\/public\//, '');
            imageUrl = imageUrl.replace(/^public\//, '');
            if (imageUrl && !imageUrl.startsWith('/')) imageUrl = `/${imageUrl}`;
            return {
                buildingName: row.buildingName,
                year: row.year,
                caption: row.caption,
                imageUrl,
            };
        });
        res.json(normalized);
    } catch (error) {
        res.status(500).json({ message: "Failed to load photos" });
    }
});

// Basic photo stats for visualization
router.get('/photos/stats', async function (_req, res) {
    const query = `
        SELECT buildingName, COUNT(*) AS count
        FROM Photos
        GROUP BY buildingName
        ORDER BY count DESC
        LIMIT 8;
    `;

    try {
        const results = await db.dbquery(query);
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: "Failed to load photo stats" });
    }
});

// Add a photo record to the database
router.post('/photos', async function (req, res) {
    const { buildingName, year, imageUrl, caption } = req.body || {};
    if (!buildingName || !imageUrl) {
        res.status(400).json({ message: "buildingName and imageUrl are required" });
        return;
    }

    const safeYear = year ? parseInt(year, 10) : null;
    const normalizedUrl = String(imageUrl).replace(/\\/g, '/');

    const query = `
        INSERT INTO Photos (buildingName, year, imageUrl, caption)
        VALUES (${mysql.escape(String(buildingName))},
                ${safeYear ? mysql.escape(safeYear) : 'NULL'},
                ${mysql.escape(normalizedUrl)},
                ${caption ? mysql.escape(String(caption)) : 'NULL'});
    `;

    try {
        await db.dbquery(query);
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ message: "Failed to add photo" });
    }
});

// Upload a local photo file and create a DB record
router.post('/photos/upload', upload.single('photo'), async function (req, res) {
    const { buildingName, year, caption } = req.body || {};
    if (!buildingName || !req.file) {
        res.status(400).json({ message: "buildingName and photo file are required" });
        return;
    }

    const safeYear = year ? parseInt(year, 10) : null;
    const imageUrl = `/uploads/${req.file.filename}`;

    const query = `
        INSERT INTO Photos (buildingName, year, imageUrl, caption)
        VALUES (${mysql.escape(String(buildingName))},
                ${safeYear ? mysql.escape(safeYear) : 'NULL'},
                ${mysql.escape(imageUrl)},
                ${caption ? mysql.escape(String(caption)) : 'NULL'});
    `;

    try {
        await db.dbquery(query);
        res.json({ ok: true, imageUrl });
    } catch (error) {
        res.status(500).json({ message: "Failed to upload photo" });
    }
});
module.exports = router;
