// Public comment thread on an issue. isOfficialUpdate is set true when the
// poster is staff/dept_admin/super_admin — that check happens in the
// controller (it needs req.user.role), the schema just stores the flag.

const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    issue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      required: [true, 'issue reference is required'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'user reference is required'],
    },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      maxlength: [500, 'Comment must be under 500 characters'],
    },
    isOfficialUpdate: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Fast reverse-chronological thread retrieval per issue
commentSchema.index({ issue: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
