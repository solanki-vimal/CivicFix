// middleware/errorHandler.js
// Centralized Express error handler middleware.
// Catches and formats error responses in the standard format.

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (error, req, res, next) => {
  // If the status code is 200, change it to 500 (since it is an error) —
  // or use error.statusCode if it was set explicitly (e.g. via AppError)
  let statusCode = error.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  let message = error.message || 'Internal Server Error';

  // Mongoose bad ObjectId
  if (error.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${error.path}: ${error.value}`;
  }

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(error.errors).map((e) => e.message).join(', ');
  }

  // Mongoose duplicate key
  if (error.code === 11000) {
    statusCode = 400;
    const field = Object.keys(error.keyValue)[0];
    message = `${field} already exists`;
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  res.status(statusCode);

  console.error(`[Error Handler] ${error.stack}`);

  // Format as requested: { success: false, message: "..." }
  res.json({
    success: false,
    message,
    // Include stack trace only in development mode for debugging
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  });
};

module.exports = { notFound, errorHandler };
