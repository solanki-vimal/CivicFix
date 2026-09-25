const { z } = require('zod');

const createCommentSchema = z.object({
  text: z
    .string({ required_error: 'Comment text is required' })
    .trim()
    .min(1, 'Comment cannot be empty')
    .max(500, 'Comment must be under 500 characters'),
});

module.exports = { createCommentSchema };
