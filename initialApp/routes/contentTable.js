//created by Tramanh

var express = require('express');
var router = express.Router();
const db = require("./dbms_promise");
var mysql = require('mysql');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { requireAdmin, requireAuth } = require('../auth');
const { createSubmission, getSubmissionById, readSubmissions, updateSubmission } = require('../photoSubmissions');

const publicDir = path.join(__dirname, '..', 'public');
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
const placeholderImageUrl = '/placeholder.svg';
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

const allowedImageTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/avif',
    'image/bmp',
    'image/x-ms-bmp',
    'image/tiff',
    'image/heic',
    'image/heif',
]);
const allowedImageExtensions = new Set([
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.avif',
    '.bmp',
    '.tif',
    '.tiff',
    '.heic',
    '.heif',
]);

function isAllowedPhotoFile(file) {
    const mimetype = String(file.mimetype || '').trim().toLowerCase();
    const extension = path.extname(file.originalname || '').toLowerCase();
    const hasImageMime = allowedImageTypes.has(mimetype);
    const hasGenericMime = !mimetype || mimetype === 'application/octet-stream' || mimetype === 'binary/octet-stream';

    return hasImageMime || (hasGenericMime && allowedImageExtensions.has(extension));
}

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: function (_req, file, cb) {
        if (!isAllowedPhotoFile(file)) {
            cb(new Error('Only image files can be uploaded'));
            return;
        }
        cb(null, true);
    },
});
const photoUpload = upload.single('photo');

function handlePhotoUpload(req, res, next) {
    photoUpload(req, res, function (error) {
        if (error) {
            const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
            res.status(status).json({
                message: error.message || 'Invalid photo upload',
            });
            return;
        }

        next();
    });
}

function normalizePublicAssetPath(assetPath) {
    let normalized = assetPath || '';
    normalized = normalized.replace(/\\/g, '/');
    normalized = normalized.replace(/^\/?initialApp\/public\//, '');
    normalized = normalized.replace(/^public\//, '');
    if (normalized && !normalized.startsWith('/')) normalized = `/${normalized}`;
    return normalized;
}

function resolveCaseInsensitivePath(filePath) {
    const relativePath = path.relative(publicDir, filePath);
    if (relativePath.startsWith('..')) {
        return null;
    }

    const segments = relativePath.split(path.sep).filter(Boolean);
    let currentPath = publicDir;
    const resolvedSegments = [];

    for (const segment of segments) {
        if (!fs.existsSync(currentPath)) {
            return null;
        }

        const entries = fs.readdirSync(currentPath);
        const match = entries.find((entry) => entry.toLowerCase() === segment.toLowerCase());
        if (!match) {
            return null;
        }

        resolvedSegments.push(match);
        currentPath = path.join(currentPath, match);
    }

    return fs.existsSync(currentPath) ? `/${resolvedSegments.join('/')}` : null;
}

function normalizeDisplayImagePath(assetPath) {
    const normalized = normalizePublicAssetPath(assetPath);
    if (!normalized) return placeholderImageUrl;
    if (normalized === placeholderImageUrl || /^(data:image\/|blob:|https?:\/\/)/i.test(normalized)) {
        return normalized;
    }

    if (!allowedImageExtensions.has(path.extname(normalized).toLowerCase())) {
        return placeholderImageUrl;
    }

    if (!normalized.startsWith('/uploads/') && !normalized.startsWith('/archiveContent/') && !normalized.startsWith('/images/')) {
        return normalized;
    }

    const publicPath = path.join(publicDir, normalized.slice(1));
    if (fs.existsSync(publicPath)) {
        return normalized;
    }

    return resolveCaseInsensitivePath(publicPath) || placeholderImageUrl;
}

function buildBuildingMatchClause(rawBuildingName, rawBuildingId) {
    const terms = Array.from(
        new Set(
            [rawBuildingName, rawBuildingId]
                .map((value) => (value ? String(value).trim() : ""))
                .filter(Boolean)
        )
    );

    if (terms.length === 0) {
        return null;
    }

    return `buildingName IN (${terms.map((term) => mysql.escape(term)).join(", ")})`;
}

router.post('/', function (_req, res) {
    res.status(410).json({
        message: "Generic SQL queries are disabled. Use the fixed content routes instead."
    });
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
    const buildingId = req.query.buildingId ? String(req.query.buildingId) : null;
    const whereClause = buildBuildingMatchClause(buildingName, buildingId);

    if (!whereClause) {
        res.status(400).json({ message: "buildingName or buildingId is required" });
        return;
    }

    const query = `
        SELECT buildingName, year, description, imagePath
        FROM Content
        WHERE ${whereClause}
        ORDER BY year ASC;
    `;

    try {
        const results = await db.dbquery(query);
        const normalized = (results || []).map((row) => {
            return {
                buildingName: row.buildingName,
                year: row.year,
                description: row.description,
                imagePath: normalizeDisplayImagePath(row.imagePath),
            };
        });
        res.json(normalized);
    } catch (error) {
        res.status(500).json({ message: "Failed to load building timeline" });
    }
});

// Create a new timeline entry
router.post('/timeline', requireAuth, async function (req, res) {
    const { buildingName, year, description, imagePath } = req.body || {};
    if (!buildingName || !year || !description) {
        res.status(400).json({ message: "buildingName, year, and description are required" });
        return;
    }

    const safeYear = parseInt(year, 10);
    if (!Number.isFinite(safeYear)) {
        res.status(400).json({ message: "year must be a valid number" });
        return;
    }

    const normalizedPath = imagePath ? String(imagePath).replace(/\\/g, '/') : null;

    const query = `
        INSERT INTO Content (buildingName, year, description, imagePath)
        VALUES (${mysql.escape(String(buildingName))},
                ${mysql.escape(safeYear)},
                ${mysql.escape(String(description))},
                ${normalizedPath ? mysql.escape(normalizedPath) : 'NULL'});
    `;

    try {
        await db.dbquery(query);
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ message: "Failed to create timeline entry" });
    }
});

// Update a timeline entry by buildingName + year
router.put('/timeline', requireAuth, async function (req, res) {
    const { buildingName, year, description, imagePath, newYear } = req.body || {};
    if (!buildingName || !year) {
        res.status(400).json({ message: "buildingName and year are required" });
        return;
    }

    const safeYear = parseInt(year, 10);
    const safeNewYear = newYear ? parseInt(newYear, 10) : null;
    if (!Number.isFinite(safeYear)) {
        res.status(400).json({ message: "year must be a valid number" });
        return;
    }
    if (newYear && !Number.isFinite(safeNewYear)) {
        res.status(400).json({ message: "newYear must be a valid number" });
        return;
    }

    const updates = [];
    if (description !== undefined) {
        updates.push(`description = ${mysql.escape(String(description))}`);
    }
    if (imagePath !== undefined) {
        const normalizedPath = imagePath ? String(imagePath).replace(/\\/g, '/') : null;
        updates.push(`imagePath = ${normalizedPath ? mysql.escape(normalizedPath) : 'NULL'}`);
    }
    if (safeNewYear) {
        updates.push(`year = ${mysql.escape(safeNewYear)}`);
    }

    if (updates.length === 0) {
        res.status(400).json({ message: "No fields provided to update" });
        return;
    }

    const query = `
        UPDATE Content
        SET ${updates.join(', ')}
        WHERE buildingName = ${mysql.escape(String(buildingName))}
          AND year = ${mysql.escape(safeYear)}
        LIMIT 1;
    `;

    try {
        await db.dbquery(query);
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ message: "Failed to update timeline entry" });
    }
});

// Delete a timeline entry by buildingName + year
router.delete('/timeline', requireAuth, async function (req, res) {
    const { buildingName, year } = req.body || {};
    if (!buildingName || !year) {
        res.status(400).json({ message: "buildingName and year are required" });
        return;
    }

    const safeYear = parseInt(year, 10);
    if (!Number.isFinite(safeYear)) {
        res.status(400).json({ message: "year must be a valid number" });
        return;
    }

    const query = `
        DELETE FROM Content
        WHERE buildingName = ${mysql.escape(String(buildingName))}
          AND year = ${mysql.escape(safeYear)}
        LIMIT 1;
    `;

    try {
        await db.dbquery(query);
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete timeline entry" });
    }
});

// Photos from database (optionally filtered by buildingName)
router.get('/photos', async function (req, res) {
    const rawLimit = parseInt(req.query.limit, 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 200) : 100;
    const buildingName = req.query.buildingName ? String(req.query.buildingName) : null;
    const buildingId = req.query.buildingId ? String(req.query.buildingId) : null;

    const buildingMatchClause = buildBuildingMatchClause(buildingName, buildingId);
    const whereClause = buildingMatchClause ? `WHERE ${buildingMatchClause}` : '';
    const query = `
        SELECT id, buildingName, year, imageUrl, caption
        FROM Photos
        ${whereClause}
        ORDER BY year DESC
        LIMIT ${limit};
    `;

    try {
        const results = await db.dbquery(query);
        const normalized = (results || []).map((row) => {
            return {
                id: row.id,
                buildingName: row.buildingName,
                year: row.year,
                caption: row.caption,
                imageUrl: normalizeDisplayImagePath(row.imageUrl),
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
router.post('/photos', requireAdmin, async function (req, res) {
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

// Update a photo record
router.put('/photos/:id', requireAdmin, async function (req, res) {
    const { id } = req.params;
    const { year, caption, imageUrl } = req.body || {};

    const safeId = parseInt(id, 10);
    if (!Number.isFinite(safeId)) {
        res.status(400).json({ message: "Invalid photo id" });
        return;
    }

    const updates = [];
    if (year !== undefined && year !== null && year !== '') {
        const safeYear = parseInt(year, 10);
        if (!Number.isFinite(safeYear)) {
            res.status(400).json({ message: "year must be a valid number" });
            return;
        }
        updates.push(`year = ${mysql.escape(safeYear)}`);
    }
    if (caption !== undefined) {
        updates.push(`caption = ${mysql.escape(String(caption))}`);
    }
    if (imageUrl !== undefined) {
        const normalizedUrl = String(imageUrl).replace(/\\/g, '/');
        updates.push(`imageUrl = ${mysql.escape(normalizedUrl)}`);
    }

    if (updates.length === 0) {
        res.status(400).json({ message: "No fields provided to update" });
        return;
    }

    const query = `
        UPDATE Photos
        SET ${updates.join(', ')}
        WHERE id = ${mysql.escape(safeId)}
        LIMIT 1;
    `;

    try {
        await db.dbquery(query);
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ message: "Failed to update photo" });
    }
});

// Delete a photo record
router.delete('/photos/:id', requireAdmin, async function (req, res) {
    const { id } = req.params;
    const safeId = parseInt(id, 10);
    if (!Number.isFinite(safeId)) {
        res.status(400).json({ message: "Invalid photo id" });
        return;
    }

    const query = `
        DELETE FROM Photos
        WHERE id = ${mysql.escape(safeId)}
        LIMIT 1;
    `;

    try {
        await db.dbquery(query);
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete photo" });
    }
});

// Upload a local photo file and create a DB record
router.get('/photos/submissions', requireAdmin, async function (req, res) {
    const status = req.query.status ? String(req.query.status).trim().toLowerCase() : '';
    const submissions = readSubmissions()
        .filter((submission) => !status || submission.status === status)
        .sort((left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime())
        .map((submission) => ({
            ...submission,
            imageUrl: normalizePublicAssetPath(submission.imageUrl),
        }));

    res.json(submissions);
});

router.post('/photos/submissions/:id/approve', requireAdmin, async function (req, res) {
    const submission = getSubmissionById(req.params.id);
    if (!submission) {
        res.status(404).json({ message: 'Photo submission not found' });
        return;
    }

    if (submission.status !== 'pending') {
        res.status(400).json({ message: 'Photo submission has already been reviewed' });
        return;
    }

    const query = `
        INSERT INTO Photos (buildingName, year, imageUrl, caption)
        VALUES (${mysql.escape(String(submission.buildingName))},
                ${submission.year ? mysql.escape(submission.year) : 'NULL'},
                ${mysql.escape(String(submission.imageUrl))},
                ${submission.caption ? mysql.escape(String(submission.caption)) : 'NULL'});
    `;

    try {
        await db.dbquery(query);
        const updated = updateSubmission(submission.id, {
            status: 'approved',
            reviewedAt: new Date().toISOString(),
            reviewedByEmail: req.authUser && req.authUser.email,
            reviewedByName: req.authUser && req.authUser.name,
        });
        res.json({ ok: true, submission: updated });
    } catch (error) {
        res.status(500).json({ message: 'Failed to approve photo submission' });
    }
});

router.post('/photos/submissions/:id/reject', requireAdmin, async function (req, res) {
    const submission = getSubmissionById(req.params.id);
    if (!submission) {
        res.status(404).json({ message: 'Photo submission not found' });
        return;
    }

    if (submission.status !== 'pending') {
        res.status(400).json({ message: 'Photo submission has already been reviewed' });
        return;
    }

    const updated = updateSubmission(submission.id, {
        status: 'rejected',
        reviewedAt: new Date().toISOString(),
        reviewedByEmail: req.authUser && req.authUser.email,
        reviewedByName: req.authUser && req.authUser.name,
    });

    res.json({ ok: true, submission: updated });
});

router.post('/photos/upload', requireAuth, handlePhotoUpload, async function (req, res) {
    const { buildingName, year, caption } = req.body || {};
    if (!buildingName || !req.file) {
        res.status(400).json({ message: "buildingName and photo file are required" });
        return;
    }

    const safeYear = year ? parseInt(year, 10) : null;
    if (year && !Number.isFinite(safeYear)) {
        res.status(400).json({ message: "year must be a valid number" });
        return;
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    const submission = createSubmission({
        buildingName: String(buildingName),
        year: safeYear,
        imageUrl,
        caption: caption ? String(caption) : 'Uploaded photo',
        submittedByEmail: req.authUser && req.authUser.email,
        submittedByName: req.authUser && req.authUser.name,
    });

    res.status(201).json({
        ok: true,
        message: "Photo submitted for admin approval",
        submission: {
            ...submission,
            imageUrl: normalizePublicAssetPath(submission.imageUrl),
        },
    });
});
module.exports = router;
