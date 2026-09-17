
const crypto = require('crypto');
const passport = require('passport');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { generateToken, sendTokenResponse, cookieOptions } = require('../utils/generateToken');
const { sendPasswordResetEmail } = require('../utils/sendEmail');

// @desc   Register a new citizen account
// @route  POST /api/auth/signup
// @access Public
const signup = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return next(new AppError('An account with this email already exists', 409));
  }

  const user = await User.create({ name, email, password, role: 'citizen' });
  sendTokenResponse(user, 201, res, 'Account created');
});

// @desc   Log in with email and password
// @route  POST /api/auth/login
// @access Public
const login = (req, res, next) => {
  passport.authenticate('local', { session: false }, async (err, user, info) => {
    if (err) return next(err);
    if (!user) return next(new AppError((info && info.message) || 'Invalid email or password', 401));

    user.lastLogin = new Date();
    await user.save();

    sendTokenResponse(user, 200, res);
  })(req, res, next);
};

// @desc   Initiates the Google OAuth2 consent redirect
// @route  GET /api/auth/google
// @access Public
const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
});

// @desc   Google OAuth callback — creates/links user, sets JWT cookie, redirects to frontend
// @route  GET /api/auth/google/callback
// @access Public
const googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, user, info) => {
    if (err) return next(err);

    if (!user) {
      const reason = encodeURIComponent((info && info.message) || 'google_auth_failed');
      return res.redirect(`${process.env.CLIENT_URL}/login?error=${reason}`);
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);
    res.cookie('token', token, cookieOptions());

    res.redirect(`${process.env.CLIENT_URL}/dashboard`);
  })(req, res, next);
};

// @desc   Clear the JWT cookie
// @route  POST /api/auth/logout
// @access Private
const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token', cookieOptions());
  res.status(200).json({ success: true, message: 'Logged out' });
});

// @desc   Return the currently authenticated user
// @route  GET /api/auth/me
// @access Private
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      avatar: req.user.avatar,
      department: req.user.department || null,
    },
  });
});

// @desc   Send a signed, time-limited password reset link via Resend
// @route  POST /api/auth/forgot-password
// @access Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always return the same response whether or not the account exists,
  // so this endpoint can't be used to enumerate registered emails.
  if (user) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;

    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (error) {
      // Don't leave a dangling, unusable token if the email failed to send
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save({ validateBeforeSave: false });
      throw error;
    }
  }

  res.status(200).json({ success: true, message: 'Reset link sent to your email' });
});

// @desc   Verify the reset token and set a new password
// @route  POST /api/auth/reset-password/:token
// @access Public
const resetPassword = asyncHandler(async (req, res, next) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select('+resetPasswordToken +resetPasswordExpires');

  if (!user) {
    return next(new AppError('Reset link is invalid or has expired', 400));
  }

  user.password = req.body.password;
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  res.status(200).json({ success: true, message: 'Password updated successfully' });
});

module.exports = {
  signup,
  login,
  googleAuth,
  googleCallback,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
};
