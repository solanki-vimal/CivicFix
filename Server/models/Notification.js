// In-app notification entries. One of the four parallel notification

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'user reference is required'],
    },
    type: {
      type: String,
      enum: ['status_change', 'official_comment', 'upvote_milestone', 'assignment'],
      required: [true, 'type is required'],
    },
    issue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      default: null, // nullable — a future account-level notification wouldn't need one
    },
    message: {
      type: String,
      required: [true, 'message is required'],
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Fast "unread count" + paginated list retrieval per user
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
