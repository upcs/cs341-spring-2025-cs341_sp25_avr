const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PHOTO_SUBMISSIONS_FILE = path.join(__dirname, 'data', 'photoSubmissions.json');
const VALID_STATUSES = new Set(['pending', 'approved', 'rejected']);

function ensureSubmissionStore() {
  const dir = path.dirname(PHOTO_SUBMISSIONS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(PHOTO_SUBMISSIONS_FILE)) {
    fs.writeFileSync(PHOTO_SUBMISSIONS_FILE, '[]\n', 'utf8');
  }
}

function normalizeStatus(status) {
  return VALID_STATUSES.has(status) ? status : 'pending';
}

function normalizeSubmission(submission) {
  if (!submission || typeof submission !== 'object') {
    return null;
  }

  return {
    id: String(submission.id || crypto.randomUUID()),
    buildingName: String(submission.buildingName || '').trim(),
    year:
      submission.year === null || submission.year === undefined || submission.year === ''
        ? null
        : Number.parseInt(submission.year, 10),
    imageUrl: String(submission.imageUrl || '').replace(/\\/g, '/'),
    caption: String(submission.caption || '').trim(),
    status: normalizeStatus(submission.status),
    submittedAt: submission.submittedAt || new Date().toISOString(),
    submittedByEmail: submission.submittedByEmail ? String(submission.submittedByEmail).trim().toLowerCase() : null,
    submittedByName: submission.submittedByName ? String(submission.submittedByName).trim() : null,
    reviewedAt: submission.reviewedAt || null,
    reviewedByEmail: submission.reviewedByEmail ? String(submission.reviewedByEmail).trim().toLowerCase() : null,
    reviewedByName: submission.reviewedByName ? String(submission.reviewedByName).trim() : null,
  };
}

function writeSubmissions(submissions) {
  ensureSubmissionStore();
  fs.writeFileSync(PHOTO_SUBMISSIONS_FILE, `${JSON.stringify(submissions, null, 2)}\n`, 'utf8');
}

function readSubmissions() {
  ensureSubmissionStore();

  try {
    const raw = fs.readFileSync(PHOTO_SUBMISSIONS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    let changed = false;
    const normalized = parsed
      .map((submission) => {
        const normalizedSubmission = normalizeSubmission(submission);
        if (!normalizedSubmission) {
          changed = true;
        }
        return normalizedSubmission;
      })
      .filter(Boolean);

    if (normalized.length !== parsed.length) {
      changed = true;
    }

    if (changed) {
      writeSubmissions(normalized);
    }

    return normalized;
  } catch (_error) {
    return [];
  }
}

function createSubmission({ buildingName, year, imageUrl, caption, submittedByEmail, submittedByName }) {
  const submissions = readSubmissions();
  const submission = normalizeSubmission({
    id: crypto.randomUUID(),
    buildingName,
    year,
    imageUrl,
    caption,
    status: 'pending',
    submittedAt: new Date().toISOString(),
    submittedByEmail,
    submittedByName,
  });

  submissions.unshift(submission);
  writeSubmissions(submissions);
  return submission;
}

function getSubmissionById(id) {
  return readSubmissions().find((submission) => submission.id === String(id)) || null;
}

function updateSubmission(id, updates) {
  const submissionId = String(id);
  const submissions = readSubmissions();
  const index = submissions.findIndex((submission) => submission.id === submissionId);

  if (index < 0) {
    return null;
  }

  const updated = normalizeSubmission({
    ...submissions[index],
    ...updates,
    id: submissionId,
  });

  submissions[index] = updated;
  writeSubmissions(submissions);
  return updated;
}

module.exports = {
  createSubmission,
  getSubmissionById,
  readSubmissions,
  updateSubmission,
};
