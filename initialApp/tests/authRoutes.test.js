/**
 * @jest-environment node
 */

const { invokeRoute } = require('./serverHelpers');

function buildAuthRouter(overrides = {}) {
  jest.resetModules();

  const authMock = {
    AUTH_COOKIE_NAME: 'avr_auth',
    authenticateUser: jest.fn(),
    buildResetUrl: jest.fn((_req, token) => `http://localhost/reset?token=${token}`),
    buildVerificationUrl: jest.fn((_req, token) => `http://localhost/verify?token=${token}`),
    createPasswordReset: jest.fn(),
    createUser: jest.fn(),
    getAuthenticatedUser: jest.fn(),
    getTokenForUser: jest.fn(() => 'signed-token'),
    refreshVerificationToken: jest.fn(),
    resetPasswordByToken: jest.fn(),
    verifyUserByToken: jest.fn(),
    ...overrides,
  };

  jest.doMock('../auth', () => authMock);
  const router = require('../routes/auth');
  return { router, authMock };
}

describe('initialApp auth routes', () => {
  test('reports auth session state and supports logout', async () => {
    const { router, authMock } = buildAuthRouter();

    authMock.getAuthenticatedUser.mockReturnValueOnce(null).mockReturnValueOnce({
      email: 'user@up.edu',
      name: 'Campus User',
      role: 'admin',
    });

    expect(await invokeRoute(router, 'get', '/session')).toMatchObject({
      status: 200,
      json: {
        authenticated: false,
        email: null,
        name: null,
        role: 'member',
      },
    });

    expect(await invokeRoute(router, 'get', '/session')).toMatchObject({
      status: 200,
      json: {
        authenticated: true,
        email: 'user@up.edu',
        name: 'Campus User',
        role: 'admin',
      },
    });

    const logoutResponse = await invokeRoute(router, 'post', '/logout');
    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.json).toEqual({ ok: true });
    expect(logoutResponse.headers['set-cookie'][0]).toContain('avr_auth=');
  });

  test('handles signup, login, verify, resend verification, and reset flows', async () => {
    const { router, authMock } = buildAuthRouter();

    authMock.createUser
      .mockReturnValueOnce({ ok: false, message: 'Name is required' })
      .mockReturnValueOnce({
        ok: true,
        user: {
          email: 'user@up.edu',
          name: 'Campus User',
          role: 'member',
          verificationToken: 'verify-token',
        },
      });
    authMock.authenticateUser
      .mockReturnValueOnce({ ok: false, message: 'Incorrect password' })
      .mockReturnValueOnce({
        ok: true,
        user: {
          email: 'user@up.edu',
          name: 'Campus User',
          role: 'admin',
        },
      });
    authMock.verifyUserByToken
      .mockReturnValueOnce({ ok: false, message: 'Invalid verification link' })
      .mockReturnValueOnce({
        ok: true,
        user: {
          email: 'user@up.edu',
          name: 'Campus User',
          role: 'member',
        },
      });
    authMock.createPasswordReset
      .mockReturnValueOnce({ ok: true, message: 'Reset ready', user: null })
      .mockReturnValueOnce({
        ok: true,
        message: 'Reset ready',
        user: { resetToken: 'reset-token' },
      });
    authMock.refreshVerificationToken
      .mockReturnValueOnce({ ok: false, message: 'No account exists' })
      .mockReturnValueOnce({
        ok: true,
        message: 'A fresh verification link is ready for this account.',
        user: {
          email: 'user@up.edu',
          name: 'Campus User',
          role: 'member',
          verificationToken: 'fresh-token',
        },
      });
    authMock.resetPasswordByToken
      .mockReturnValueOnce({ ok: false, message: 'Invalid password reset link' })
      .mockReturnValueOnce({
        ok: true,
        user: {
          email: 'user@up.edu',
          name: 'Campus User',
          role: 'member',
          resetToken: 'fresh-reset-token',
        },
      });

    expect(
      await invokeRoute(router, 'post', '/signup', {
        body: { name: '', email: 'user@up.edu', password: 'password1' },
        headers: { host: 'localhost' },
      })
    ).toMatchObject({
      status: 400,
      json: { message: 'Name is required' },
    });

    const signupResponse = await invokeRoute(router, 'post', '/signup', {
      body: { name: 'Campus User', email: 'user@up.edu', password: 'password1' },
      headers: { host: 'localhost' },
    });
    expect(signupResponse.status).toBe(201);
    expect(signupResponse.json).toMatchObject({
      ok: true,
      email: 'user@up.edu',
      role: 'member',
      verificationUrl: 'http://localhost/verify?token=verify-token',
    });

    expect(
      await invokeRoute(router, 'post', '/login', {
        body: { email: 'user@up.edu', password: 'wrongpass' },
      })
    ).toMatchObject({
      status: 401,
      json: { message: 'Incorrect password' },
    });

    const loginResponse = await invokeRoute(router, 'post', '/login', {
      body: { email: 'user@up.edu', password: 'password1' },
    });
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.json).toMatchObject({
      ok: true,
      email: 'user@up.edu',
      name: 'Campus User',
      role: 'admin',
    });
    expect(loginResponse.headers['set-cookie'][0]).toContain('avr_auth=signed-token');

    expect(
      await invokeRoute(router, 'post', '/verify', {
        body: { token: 'bad-token' },
      })
    ).toMatchObject({
      status: 400,
      json: { message: 'Invalid verification link' },
    });

    expect(
      await invokeRoute(router, 'post', '/verify', {
        body: { token: 'verify-token' },
      })
    ).toMatchObject({
      status: 200,
      json: {
        ok: true,
        email: 'user@up.edu',
        name: 'Campus User',
        role: 'member',
        message: 'Email verified. You can now sign in.',
      },
    });

    expect(
      await invokeRoute(router, 'post', '/forgot-password', {
        body: { email: 'missing@up.edu' },
        headers: { host: 'localhost' },
      })
    ).toMatchObject({
      status: 200,
      json: {
        ok: true,
        message: 'Reset ready',
        resetUrl: null,
      },
    });

    expect(
      await invokeRoute(router, 'post', '/forgot-password', {
        body: { email: 'user@up.edu' },
        headers: { host: 'localhost' },
      })
    ).toMatchObject({
      status: 200,
      json: {
        ok: true,
        message: 'Reset ready',
        resetUrl: 'http://localhost/reset?token=reset-token',
      },
    });

    expect(
      await invokeRoute(router, 'post', '/resend-verification', {
        body: { email: 'missing@up.edu' },
        headers: { host: 'localhost' },
      })
    ).toMatchObject({
      status: 400,
      json: { message: 'No account exists' },
    });

    expect(
      await invokeRoute(router, 'post', '/resend-verification', {
        body: { email: 'user@up.edu' },
        headers: { host: 'localhost' },
      })
    ).toMatchObject({
      status: 200,
      json: {
        ok: true,
        email: 'user@up.edu',
        name: 'Campus User',
        role: 'member',
        message: 'A fresh verification link is ready for this account.',
        verificationUrl: 'http://localhost/verify?token=fresh-token',
      },
    });

    expect(
      await invokeRoute(router, 'post', '/reset-password', {
        body: { token: 'bad-token', password: 'password2' },
      })
    ).toMatchObject({
      status: 400,
      json: { message: 'Invalid password reset link' },
    });

    expect(
      await invokeRoute(router, 'post', '/reset-password', {
        body: { token: 'reset-token', password: 'password2' },
      })
    ).toMatchObject({
      status: 200,
      json: {
        ok: true,
        email: 'user@up.edu',
        name: 'Campus User',
        role: 'member',
        message: 'Password reset. You can now sign in.',
      },
    });
  });
});
