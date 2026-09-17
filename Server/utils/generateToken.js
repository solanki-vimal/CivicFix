// Signs JWTs and sets them as an httpOnly cookie. Used by signup, login,
// and the Google OAuth callback so all three issue tokens identically.

const jwt = require('jsonwebtoken');

// Converts a duration string like '7d', '12h', '30m' to milliseconds for
// cookie maxAge. Falls back to 7 days if the format isn't recognized.
const parseDurationToMs = (duration) => {
  const match = /^(\d+)\s*(ms|s|m|h|d)$/.exec(String(duration).trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000;

  const value = Number(match[1]);
  const unitMs = { ms: 1, s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return value * unitMs[match[2]];
};

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: parseDurationToMs(process.env.JWT_EXPIRES_IN),
});

// Signs a token for the given user, sets the cookie, and sends the
// standardized { success, data, message? } response body.
const sendTokenResponse = (user, statusCode, res, message) => {
  const token = generateToken(user._id);
  res.cookie('token', token, cookieOptions());

  const payload = {
    success: true,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      department: user.department || null,
    },
  };
  if (message) payload.message = message;

  res.status(statusCode).json(payload);
};

module.exports = { generateToken, sendTokenResponse, cookieOptions };