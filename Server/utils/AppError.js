// utils/AppError.js
// Lightweight custom error class — set a statusCode + isOperational flag
// so errorHandler.js can distinguish expected/handled errors from bugs.
// Usage: throw new AppError('Issue not found', 404);

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
