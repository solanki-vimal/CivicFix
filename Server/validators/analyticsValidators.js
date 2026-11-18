const { z } = require('zod');

// Optional: narrow the analytics to one department. Dept admins are always
// pinned to their own department by the controller, whatever they pass.
const analyticsQuerySchema = z.object({
  department: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format').optional(),
});

module.exports = { analyticsQuerySchema };
