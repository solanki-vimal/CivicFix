
const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema(
  {
    issue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      required: [true, 'issue reference is required'],
    },
    fromStatus: {
      type: String,
      enum: ['pending', 'open', 'in_progress', 'resolved', 'rejected', null],
      default: null, // null for the very first entry (issue creation)
    },
    toStatus: {
      type: String,
      enum: ['pending', 'open', 'in_progress', 'resolved', 'rejected'],
      required: [true, 'toStatus is required'],
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'changedBy is required'],
    },
    note: {
      type: String,
      trim: true,
      default: null,
      validate: {
        validator: function (value) {
          return this.toStatus !== 'rejected' || (typeof value === 'string' && value.trim().length > 0);
        },
        message: 'note is required when toStatus is rejected',
      },
    },
  },
  { timestamps: true }
);

// Fast chronological timeline retrieval for a given issue
statusHistorySchema.index({ issue: 1, createdAt: 1 });

module.exports = mongoose.model('StatusHistory', statusHistorySchema);
