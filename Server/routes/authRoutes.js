// Mounted at /api/auth in server.js.

const express = require('express');
const router = express.Router();

const {
  signup,
  login,
  googleAuth,
  googleCallback,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../validators/authValidators');

router.post('/signup', authLimiter, validate(signupSchema), signup);
router.post('/login', authLimiter, validate(loginSchema), login);

router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password/:token', authLimiter, validate(resetPasswordSchema), resetPassword);

module.exports = router;
