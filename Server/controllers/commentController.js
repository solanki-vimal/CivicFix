const asyncHandler = require('express-async-handler');
const Comment = require('../models/Comment');
const Issue = require('../models/Issue');
const AppError = require('../utils/AppError');

// @desc   Add a comment to an issue. isOfficialUpdate is set true
//         automatically when the poster's role isn't 'citizen' — the
//         client can never set this itself.
// @route  POST /api/issues/:id/comments
// @access Private (any authenticated role)
const addComment = asyncHandler(async (req, res, next) => {
  const issueExists = await Issue.exists({ _id: req.params.id });
  if (!issueExists) {
    return next(new AppError('Issue not found', 404));
  }

  const comment = await Comment.create({
    issue: req.params.id,
    user: req.user._id,
    text: req.body.text,
    isOfficialUpdate: req.user.role !== 'citizen',
  });

  const populated = await comment.populate('user', 'name avatar role');

  res.status(201).json({ success: true, data: populated });
});

// @desc   List comments for an issue, newest first
// @route  GET /api/issues/:id/comments
// @access Public
const getComments = asyncHandler(async (req, res, next) => {
  const issueExists = await Issue.exists({ _id: req.params.id });
  if (!issueExists) {
    return next(new AppError('Issue not found', 404));
  }

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = { issue: req.params.id };

  const [comments, total] = await Promise.all([
    Comment.find(filter).populate('user', 'name avatar role').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Comment.countDocuments(filter),
  ]);

  res.status(200).json({ success: true, data: comments, pagination: { page, limit, total } });
});

module.exports = { addComment, getComments };
