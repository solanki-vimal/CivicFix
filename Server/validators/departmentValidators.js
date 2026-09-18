const { z } = require('zod');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

const createDepartmentSchema = z.object({
  name: z
    .string({ required_error: 'Department name is required' })
    .trim()
    .min(2, 'Department name must be at least 2 characters')
    .max(60, 'Department name must be under 60 characters'),
  description: z.string().trim().max(300, 'Description must be under 300 characters').optional().default(''),
  headAdmin: objectId.optional(),
});

const updateDepartmentSchema = z
  .object({
    name: z.string().trim().min(2).max(60).optional(),
    description: z.string().trim().max(300).optional(),
    headAdmin: objectId.nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required to update',
  });

module.exports = { createDepartmentSchema, updateDepartmentSchema };
