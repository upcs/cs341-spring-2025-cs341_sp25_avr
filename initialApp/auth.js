const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const AUTH_COOKIE_NAME = 'avr_auth';
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const VERIFY_TOKEN_TTL_MS = 1000 * 60 * 60 * 24;

function ensureUserStore() {
  const dir = path.dirname(USERS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, '[]\n', 'utf8');
  }
}

function readUsers() {
  ensureUserStore();
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function writeUsers(users) {
  ensureUserStore();
  fs.writeFileSync(USERS_FILE, `${JSON.stringify(users, null, 2)}\n`, 'utf8');
}

function saveUser(updatedUser) {
  const users = readUsers().map((user) => (user.id === updatedUser.id ? updatedUser : user));
  writeUsers(users);
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidUpEmail(email) {
  return /^[a-z0-9._%+-]+@up\.edu$/i.test(normalizeEmail(email));
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) {
    return false;
  }

  const [salt] = storedHash.split(':');
  return hashPassword(password, salt) === storedHash;
}

function buildToken(email, passwordHash) {
  return crypto.createHash('sha256').update(`${email}:${passwordHash}`).digest('hex');
}

function getTokenForUser(user) {
  return buildToken(user.email, user.passwordHash);
}

function findUserByEmail(email) {
  const normalized = normalizeEmail(email);
  return readUsers().find((user) => user.email === normalized) || null;
}

function getUserForToken(token) {
  if (!token) return null;
  return readUsers().find((user) => getTokenForUser(user) === token) || null;
}

function createUser({ name, email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const trimmedName = String(name || '').trim();
  const rawPassword = String(password || '');

  if (!trimmedName) {
    return { ok: false, message: 'Name is required' };
  }
  if (!isValidUpEmail(normalizedEmail)) {
    return { ok: false, message: 'Use a valid @up.edu email address' };
  }
  if (rawPassword.length < 8) {
    return { ok: false, message: 'Password must be at least 8 characters' };
  }
  if (findUserByEmail(normalizedEmail)) {
    return { ok: false, message: 'An account with that email already exists' };
  }

  const users = readUsers();
  const user = {
    id: crypto.randomUUID(),
    name: trimmedName,
    email: normalizedEmail,
    passwordHash: hashPassword(rawPassword),
    verified: false,
    verificationToken: crypto.randomBytes(24).toString('hex'),
    verificationExpiresAt: new Date(Date.now() + VERIFY_TOKEN_TTL_MS).toISOString(),
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  writeUsers(users);

  return { ok: true, user };
}

function authenticateUser(email, password) {
  const user = findUserByEmail(email);
  if (!user) {
    return { ok: false, message: 'No account exists for that @up.edu email. Sign up first or check the address.' };
  }
  if (!verifyPassword(password, user.passwordHash)) {
    return { ok: false, message: 'Incorrect password. Try again or use the same password you created during sign up.' };
  }
  if (!user.verified) {
    return { ok: false, message: 'Your account is not verified yet. Open the verification link first, then sign in.' };
  }
  return { ok: true, user };
}

function verifyUserByToken(token) {
  if (!token) {
    return { ok: false, message: 'Verification token is required' };
  }

  const user = readUsers().find((entry) => entry.verificationToken === token) || null;
  if (!user) {
    return { ok: false, message: 'Invalid verification link' };
  }

  if (user.verified) {
    return { ok: true, user };
  }

  if (!user.verificationExpiresAt || new Date(user.verificationExpiresAt).getTime() < Date.now()) {
    return { ok: false, message: 'Verification link has expired' };
  }

  user.verified = true;
  user.verificationToken = null;
  user.verificationExpiresAt = null;
  user.verifiedAt = new Date().toISOString();
  saveUser(user);
  return { ok: true, user };
}

function buildVerificationUrl(req, token) {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol = forwardedProto || req.protocol || 'http';
  const host = req.get('host');
  return `${protocol}://${host}/?verify=${token}`;
}

function getAuthenticatedUser(req) {
  const token = req.cookies && req.cookies[AUTH_COOKIE_NAME];
  return getUserForToken(token);
}

function isAuthenticated(req) {
  return Boolean(getAuthenticatedUser(req));
}

function requireAuth(req, res, next) {
  const user = getAuthenticatedUser(req);
  if (user) {
    req.authUser = user;
    return next();
  }
  res.status(401).json({ message: 'Authentication required' });
}

module.exports = {
  AUTH_COOKIE_NAME,
  authenticateUser,
  createUser,
  buildVerificationUrl,
  getAuthenticatedUser,
  getTokenForUser,
  isAuthenticated,
  isValidUpEmail,
  normalizeEmail,
  readUsers,
  requireAuth,
  verifyUserByToken,
};
