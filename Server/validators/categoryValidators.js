const { z } = require('zod');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');
const hexColor = z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Color must be a valid hex code');

const createCategorySchema = z.object({
  name: z
    .string({ required_error: 'Category name is required' })
    .trim()
    .min(2, 'Category name must be at least 2 characters')
    .max(60, 'Category name must be under 60 characters'),
  icon: z.string().trim().max(50).optional().default(''),
  color: hexColor.optional(),
  department: objectId,
});

const updateCategorySchema = z
  .object({
    name: z.string().trim().min(2).max(60).optional(),
    icon: z.string().trim().max(50).optional(),
    color: hexColor.optional(),
    department: objectId.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required to update',
  });

module.exports = { createCategorySchema, updateCategorySchema };
