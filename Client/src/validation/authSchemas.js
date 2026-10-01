// src/validation/authSchemas.js
// Mirrors Server/validators/authValidators.js so the user sees the same
// validation feedback instantly, without a round trip. The backend schema
// remains the actual source of truth — this is purely for UX.
//
// confirmPassword exists only here: it's a client-side typo guard. The
// backend never receives it (SignupPage strips it before calling the API).

import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
