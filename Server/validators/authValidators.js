// Zod schemas for every auth route body.
// Rules table: email required/valid/unique (uniqueness checked in the
// controller, not here), password required/min 8 chars.

const { z } = require('zod');

const emailField = z
  .string({ required_error: 'Email is required' })
  .trim()
  .toLowerCase()
  .email('Please provide a valid email address');

const passwordField = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters');

const signupSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name must be under 60 characters'),
  email: emailField,
  password: passwordField,
});

const loginSchema = z.object({
  email: emailField,
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: emailField,
});

const resetPasswordSchema = z.object({
  password: passwordField,
});

module.exports = { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema };
