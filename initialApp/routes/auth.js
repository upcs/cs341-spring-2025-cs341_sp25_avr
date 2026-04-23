var express = require('express');
var router = express.Router();

const {
  AUTH_COOKIE_NAME,
  authenticateUser,
  buildResetUrl,
  buildVerificationUrl,
  createPasswordReset,
  createUser,
  getAuthenticatedUser,
  getTokenForUser,
  refreshVerificationToken,
  resetPasswordByToken,
  verifyUserByToken,
} = require('../auth');

function setAuthCookie(res, user) {
  res.cookie(AUTH_COOKIE_NAME, getTokenForUser(user), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 12,
  });
}

router.get('/session', function(req, res) {
  const user = getAuthenticatedUser(req);
  res.json({
    authenticated: Boolean(user),
    email: user ? user.email : null,
    name: user ? user.name : null,
    role: user ? user.role : 'member',
  });
});

router.post('/signup', function(req, res) {
  const { name, email, password } = req.body || {};
  const result = createUser({ name, email, password });

  if (!result.ok) {
    res.status(400).json({ message: result.message });
    return;
  }

  res.status(201).json({
    ok: true,
    email: result.user.email,
    name: result.user.name,
    role: result.user.role,
    verificationSent: true,
    verificationUrl: buildVerificationUrl(req, result.user.verificationToken),
    message: 'Check your @up.edu email for the verification link before signing in.',
  });
});

router.post('/login', function(req, res) {
  const { email, password } = req.body || {};
  const result = authenticateUser(email, password);

  if (!result.ok) {
    res.status(401).json({ message: result.message });
    return;
  }

  setAuthCookie(res, result.user);
  res.json({ ok: true, email: result.user.email, name: result.user.name, role: result.user.role });
});

router.post('/verify', function(req, res) {
  const token = req.body && req.body.token;
  const result = verifyUserByToken(token);

  if (!result.ok) {
    res.status(400).json({ message: result.message });
    return;
  }

  res.json({
    ok: true,
    email: result.user.email,
    name: result.user.name,
    role: result.user.role,
    message: 'Email verified. You can now sign in.',
  });
});

router.post('/forgot-password', function(req, res) {
  const { email } = req.body || {};
  const result = createPasswordReset(email);

  res.json({
    ok: true,
    message: result.message,
    resetUrl: result.user ? buildResetUrl(req, result.user.resetToken) : null,
  });
});

router.post('/resend-verification', function(req, res) {
  const { email } = req.body || {};
  const result = refreshVerificationToken(email);

  if (!result.ok) {
    res.status(400).json({ message: result.message });
    return;
  }

  res.json({
    ok: true,
    email: result.user.email,
    name: result.user.name,
    role: result.user.role,
    message: result.message,
    verificationUrl: result.user.verificationToken
      ? buildVerificationUrl(req, result.user.verificationToken)
      : null,
  });
});

router.post('/reset-password', function(req, res) {
  const { token, password } = req.body || {};
  const result = resetPasswordByToken(token, password);

  if (!result.ok) {
    res.status(400).json({ message: result.message });
    return;
  }

  res.json({
    ok: true,
    email: result.user.email,
    name: result.user.name,
    role: result.user.role,
    message: 'Password reset. You can now sign in.',
  });
});

router.post('/logout', function(_req, res) {
  res.clearCookie(AUTH_COOKIE_NAME);
  res.json({ ok: true });
});

module.exports = router;
