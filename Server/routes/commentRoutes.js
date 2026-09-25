// Mounted at /:id/comments inside issueRoutes.js — mergeParams: true is
// required so req.params.id (the issue ID) is visible here, since Express
// doesn't pass parent route params to a nested router by default.

const express = require('express');
const router = express.Router({ mergeParams: true });

const { addComment, getComments } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createCommentSchema } = require('../validators/commentValidators');

router.post('/', protect, validate(createCommentSchema), addComment);
router.get('/', getComments);

module.exports = router;
