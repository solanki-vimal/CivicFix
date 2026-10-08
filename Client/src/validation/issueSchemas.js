// Mirrors Server/validators/issueValidators.js (createIssueSchema) plus the
// Multer limits from Server/middleware/upload.js, so the user gets instant
// feedback. The backend remains the source of truth — this is UX only.
//
// `location` is one object here for convenience; api/issueApi.js flattens it
// into the separate lng/lat form fields the backend expects.

import { z } from 'zod';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB, same as the server
export const MAX_IMAGES = 3;

const LOCATION_MESSAGE = 'Pin the location on the map';

export const reportIssueSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, 'Title must be at least 5 characters')
    .max(120, 'Title must be under 120 characters'),
  category: z.string().min(1, 'Choose a category'),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be under 1000 characters'),
  address: z.string().trim().max(300, 'Address must be under 300 characters').optional(),
  location: z.object(
    {
      lng: z.number().min(-180).max(180),
      lat: z.number().min(-90).max(90),
    },
    { required_error: LOCATION_MESSAGE, invalid_type_error: LOCATION_MESSAGE }
  ),
  images: z
    .array(z.instanceof(File))
    .max(MAX_IMAGES, `You can attach up to ${MAX_IMAGES} photos`)
    .superRefine((files, ctx) => {
      files.forEach((file) => {
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
          ctx.addIssue({ code: 'custom', message: `${file.name} must be a JPG, PNG or WEBP image` });
        } else if (file.size > MAX_IMAGE_BYTES) {
          ctx.addIssue({ code: 'custom', message: `${file.name} must be under 5 MB` });
        }
      });
    }),
});
