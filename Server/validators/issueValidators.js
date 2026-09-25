// Note: no `images` field yet — Multer/Cloudinary upload pipeline is Phase 5
// scope. Issue creation here is a plain JSON body, not multipart/form-data.

const { z } = require('zod');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

const createIssueSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(5, 'Title must be at least 5 characters')
    .max(120, 'Title must be under 120 characters'),
  description: z
    .string({ required_error: 'Description is required' })
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be under 1000 characters'),
  category: objectId,
  location: z.object({
    lng: z.number().min(-180).max(180),
    lat: z.number().min(-90).max(90),
  }),
  address: z.string().trim().max(300).optional().default(''),
});

// PATCH /api/issues/:id/status — staff/admin can update status, assignee,
// and priority together, or independently. rejectionReason is required
// only when status is being set to 'rejected' (enforced via refine, since
// it depends on another field in the same body).
const updateStatusSchema = z
  .object({
    status: z.enum(['pending', 'open', 'in_progress', 'resolved', 'rejected']).optional(),
    assignedTo: objectId.nullable().optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    rejectionReason: z.string().trim().max(500).optional(),
    note: z.string().trim().max(500).optional(), // optional context for the StatusHistory entry
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required to update',
  })
  .refine((data) => data.status !== 'rejected' || (data.rejectionReason && data.rejectionReason.length > 0), {
    message: 'rejectionReason is required when status is set to rejected',
    path: ['rejectionReason'],
  });

// GET /api/issues query params — everything arrives as a string, so
// z.coerce is used for anything numeric.
const listIssuesQuerySchema = z.object({
  category: objectId.optional(),
  status: z.enum(['pending', 'open', 'in_progress', 'resolved', 'rejected']).optional(),
  department: objectId.optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  radius: z.coerce.number().positive().max(50000).optional().default(5000), // meters, default 5km
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

module.exports = { createIssueSchema, updateStatusSchema, listIssuesQuerySchema };
