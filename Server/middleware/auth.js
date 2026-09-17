// Authentication and authorization middlewares.
// Verifies JWT token and checks role permissions.

const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Read token from HTTPOnly cookies
  if (req.cookies && req.cookies.token) {
    try {
      token = req.cookies.token;

      // Decode token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token and attach to req.user (excluding password hash)
      req.user = await User.findById(decoded.id);

      if (!req.user) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }
});

// Authorize roles - grant access only to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`Role '${req.user ? req.user.role : 'anonymous'}' is not authorized to access this resource`);
    }
    next();
  };
};

module.exports = { protect, authorize };
