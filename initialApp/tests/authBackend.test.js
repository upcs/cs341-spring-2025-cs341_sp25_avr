/**
 * @jest-environment node
 */

const fs = require('fs');
const path = require('path');

const usersFile = path.join(__dirname, '../data/users.json');
const originalUsersFile = fs.readFileSync(usersFile, 'utf8');

function loadAuth() {
  jest.resetModules();
  return require('../auth');
}

function readUsersFromDisk() {
  return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
}

describe('initialApp auth backend helpers', () => {
  beforeEach(() => {
    fs.writeFileSync(usersFile, '[]\n', 'utf8');
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-16T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(() => {
    fs.writeFileSync(usersFile, originalUsersFile, 'utf8');
  });

  test('creates users with normalized identity data and rejects invalid signups', () => {
    const auth = loadAuth();

    expect(auth.createUser({ name: '', email: 'user@up.edu', password: 'password1' })).toMatchObject({
      ok: false,
      message: 'Name is required',
    });
    expect(auth.createUser({ name: 'Test User', email: 'user@example.com', password: 'password1' })).toMatchObject({
      ok: false,
      message: 'Use a valid @up.edu email address',
    });
    expect(auth.createUser({ name: 'Test User', email: 'user@up.edu', password: 'short' })).toMatchObject({
      ok: false,
      message: 'Password must be at least 8 characters',
    });

    const created = auth.createUser({
      name: ' Test User ',
      email: 'USER@UP.EDU',
      password: 'password1',
    });

    expect(created.ok).toBe(true);
    expect(created.user).toMatchObject({
      name: 'Test User',
      email: 'user@up.edu',
      role: 'member',
      verified: false,
      createdAt: '2026-04-16T12:00:00.000Z',
    });
    expect(created.user.passwordHash).toContain(':');
    expect(created.user.verificationToken).toBeTruthy();
    expect(auth.createUser({ name: 'Again', email: 'user@up.edu', password: 'password1' })).toMatchObject({
      ok: false,
      message: 'An account with that email already exists',
    });
  });

  test('authenticates verified users and resolves auth state from cookies', () => {
    const auth = loadAuth();
    const created = auth.createUser({
      name: 'Campus User',
      email: 'campus@up.edu',
      password: 'password1',
    });

    expect(auth.authenticateUser('missing@up.edu', 'password1')).toMatchObject({
      ok: false,
      message: expect.stringContaining('No account exists'),
    });
    expect(auth.authenticateUser('campus@up.edu', 'wrongpass')).toMatchObject({
      ok: false,
      message: expect.stringContaining('Incorrect password'),
    });
    expect(auth.authenticateUser('campus@up.edu', 'password1')).toMatchObject({
      ok: false,
      message: expect.stringContaining('not verified'),
    });

    expect(auth.verifyUserByToken()).toMatchObject({
      ok: false,
      message: 'Verification token is required',
    });
    expect(auth.verifyUserByToken('missing-token')).toMatchObject({
      ok: false,
      message: 'Invalid verification link',
    });
    expect(auth.verifyUserByToken(created.user.verificationToken)).toMatchObject({
      ok: true,
      user: expect.objectContaining({
        email: 'campus@up.edu',
        verified: true,
      }),
    });
    expect(auth.verifyUserByToken(created.user.verificationToken)).toMatchObject({
      ok: false,
      message: 'Invalid verification link',
    });

    const signedIn = auth.authenticateUser('campus@up.edu', 'password1');
    expect(signedIn).toMatchObject({
      ok: true,
      user: expect.objectContaining({
        email: 'campus@up.edu',
      }),
    });

    const req = { cookies: { [auth.AUTH_COOKIE_NAME]: auth.getTokenForUser(signedIn.user) } };
    expect(auth.getAuthenticatedUser(req)).toMatchObject({
      email: 'campus@up.edu',
    });
    expect(auth.isAuthenticated(req)).toBe(true);

    const next = jest.fn();
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    auth.requireAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.authUser).toMatchObject({ email: 'campus@up.edu' });
  });

  test('assigns the default admin role and enforces admin-only access', () => {
    const auth = loadAuth();
    const created = auth.createUser({
      name: 'Admin User',
      email: 'admin@up.edu',
      password: 'password1',
    });

    expect(created).toMatchObject({
      ok: true,
      user: expect.objectContaining({
        email: 'admin@up.edu',
        role: 'admin',
      }),
    });

    auth.verifyUserByToken(created.user.verificationToken);
    const req = { cookies: { [auth.AUTH_COOKIE_NAME]: auth.getTokenForUser(created.user) } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    auth.requireAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.authUser).toMatchObject({
      email: 'admin@up.edu',
      role: 'admin',
    });
  });

  test('expires verification links, refreshes them, and builds public URLs', () => {
    const auth = loadAuth();
    const created = auth.createUser({
      name: 'Campus User',
      email: 'campus@up.edu',
      password: 'password1',
    });

    jest.setSystemTime(new Date('2026-04-17T13:00:00.000Z'));
    expect(auth.verifyUserByToken(created.user.verificationToken)).toMatchObject({
      ok: false,
      message: 'Verification link has expired',
    });

    expect(auth.refreshVerificationToken('missing@up.edu')).toMatchObject({
      ok: false,
      message: expect.stringContaining('No account exists'),
    });

    const refreshed = auth.refreshVerificationToken('campus@up.edu');
    expect(refreshed).toMatchObject({
      ok: true,
      message: 'A fresh verification link is ready for this account.',
    });
    expect(refreshed.user.verificationToken).not.toBe(created.user.verificationToken);

    const req = {
      headers: { 'x-forwarded-proto': 'https' },
      protocol: 'http',
      get: jest.fn(() => 'campus.up.edu'),
    };

    expect(auth.buildVerificationUrl(req, 'verify-token')).toBe('https://campus.up.edu/?verify=verify-token');
    expect(auth.buildResetUrl(req, 'reset-token')).toBe('https://campus.up.edu/?reset=reset-token');

    const verifiedUsers = readUsersFromDisk();
    verifiedUsers[0].verified = true;
    fs.writeFileSync(usersFile, `${JSON.stringify(verifiedUsers, null, 2)}\n`, 'utf8');

    expect(auth.refreshVerificationToken('campus@up.edu')).toMatchObject({
      ok: true,
      message: 'That account is already verified.',
    });
  });

  test('creates and redeems password resets while enforcing expiry and password rules', () => {
    const auth = loadAuth();
    const created = auth.createUser({
      name: 'Reset User',
      email: 'reset@up.edu',
      password: 'password1',
    });

    auth.verifyUserByToken(created.user.verificationToken);

    expect(auth.createPasswordReset('missing@up.edu')).toMatchObject({
      ok: true,
      user: null,
      message: expect.stringContaining('password reset link'),
    });

    const resetResult = auth.createPasswordReset('reset@up.edu');
    expect(resetResult).toMatchObject({
      ok: true,
      user: expect.objectContaining({
        email: 'reset@up.edu',
      }),
    });

    expect(auth.resetPasswordByToken()).toMatchObject({
      ok: false,
      message: 'Reset token is required',
    });
    expect(auth.resetPasswordByToken('missing-token', 'password2')).toMatchObject({
      ok: false,
      message: 'Invalid password reset link',
    });
    expect(auth.resetPasswordByToken(resetResult.user.resetToken, 'short')).toMatchObject({
      ok: false,
      message: 'Password must be at least 8 characters',
    });

    jest.setSystemTime(new Date('2026-04-16T13:00:00.000Z'));
    expect(auth.resetPasswordByToken(resetResult.user.resetToken, 'password2')).toMatchObject({
      ok: false,
      message: 'Password reset link has expired',
    });

    jest.setSystemTime(new Date('2026-04-16T12:00:00.000Z'));
    const freshReset = auth.createPasswordReset('reset@up.edu');
    expect(auth.resetPasswordByToken(freshReset.user.resetToken, 'password2')).toMatchObject({
      ok: true,
      user: expect.objectContaining({
        email: 'reset@up.edu',
      }),
    });

    expect(auth.authenticateUser('reset@up.edu', 'password1')).toMatchObject({
      ok: false,
      message: expect.stringContaining('Incorrect password'),
    });
    expect(auth.authenticateUser('reset@up.edu', 'password2')).toMatchObject({
      ok: true,
      user: expect.objectContaining({
        email: 'reset@up.edu',
      }),
    });
  });

  test('normalizes legacy users without verification fields when reading from disk', () => {
    fs.writeFileSync(
      usersFile,
      `${JSON.stringify([
        {
          id: 'legacy-user',
          name: 'Legacy User',
          email: 'legacy@up.edu',
          passwordHash: 'salt:hash',
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      ], null, 2)}\n`,
      'utf8'
    );

    const auth = loadAuth();
    const users = auth.readUsers();

    expect(users[0]).toMatchObject({
      email: 'legacy@up.edu',
      verified: true,
      verificationToken: null,
      verificationExpiresAt: null,
      verifiedAt: '2025-01-01T00:00:00.000Z',
    });
  });
});
