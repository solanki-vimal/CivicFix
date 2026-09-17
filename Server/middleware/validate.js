// Generic Zod body validator. Usage: router.post('/x', validate(someSchema), handler)
// Replaces req.body with the parsed (and coerced/trimmed) result on success,
// so downstream controllers get clean data.

const { ZodError } = require('zod');
const AppError = require('../utils/AppError');

const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.errors.map((e) => e.message).join(', ');
      return next(new AppError(message, 400));
    }
    next(error);
  }
};

module.exports = validate;
