const { z } = require('zod');

const ROLES = ['citizen', 'staff', 'dept_admin', 'super_admin'];
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

// Query-string values are always strings, hence z.coerce for numbers and an
// enum of 'true'/'false' for the boolean filter.
const listUsersQuerySchema = z.object({
  role: z.enum(ROLES).optional(),
  department: objectId.optional(),
  isActive: z.enum(['true', 'false']).optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

// staff and dept_admin always belong to a department; citizen and super_admin
// never do (the controller clears it for those roles).
const updateRoleSchema = z
  .object({
    role: z.enum(ROLES),
    department: objectId.nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if ((data.role === 'staff' || data.role === 'dept_admin') && !data.department) {
      ctx.addIssue({
        code: 'custom',
        path: ['department'],
        message: 'department is required for the staff and dept_admin roles',
      });
    }
  });

module.exports = { listUsersQuerySchema, updateRoleSchema };
