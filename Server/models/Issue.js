// Core document — a civic issue report. `department` is copied from the
// chosen category at creation time (the auto-routing mechanism, so issues can be queried by
// department directly without a join back through category.

const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [120, 'Title must be under 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description must be under 1000 characters'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'], // set server-side from category.department
    },
    status: {
      type: String,
      enum: ['pending', 'open', 'in_progress', 'resolved', 'rejected'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: [true, 'Location coordinates are required'],
        validate: {
          validator: (coords) =>
            Array.isArray(coords) &&
            coords.length === 2 &&
            coords[0] >= -180 &&
            coords[0] <= 180 &&
            coords[1] >= -90 &&
            coords[1] <= 90,
          message: 'Coordinates must be [lng, lat] within valid ranges',
        },
      },
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    images: {
      type: [String], // Cloudinary secure_urls
      default: [],
      validate: {
        validator: (arr) => arr.length <= 3,
        message: 'A maximum of 3 images is allowed per issue',
      },
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'reportedBy is required'],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // expected to reference a user with role 'staff'
    },
    upvotes: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: null,
      validate: {
        // Enforced at the schema level rather than left to controller logic,
        // so a bad write can't slip through from anywhere else in the codebase.
        validator: function (value) {
          return this.status !== 'rejected' || (typeof value === 'string' && value.trim().length > 0);
        },
        message: 'rejectionReason is required when status is rejected',
      },
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes 

// Geospatial index — powers 'near me' via $near / $geoWithin. Required, not optional.
issueSchema.index({ location: '2dsphere' });

// Default public feed: unfiltered, newest first.
issueSchema.index({ createdAt: -1 });

// Public feed filtered by status, sorted newest first (also serves "status alone" queries).
issueSchema.index({ status: 1, createdAt: -1 });

// Dept Admin / Staff dashboards: this department's issues, filtered by status
// (also serves "everything in department X" with no status filter).
issueSchema.index({ department: 1, status: 1 });

// Public feed filtered by category + status together (also serves category alone).
issueSchema.index({ category: 1, status: 1 });

// GET /api/issues/mine — a citizen's own reports, newest first.
issueSchema.index({ reportedBy: 1, createdAt: -1 });

// Staff workload aggregation ($match assignedTo exists, status: in_progress).
issueSchema.index({ assignedTo: 1, status: 1 });

// Virtual: upvote count without sending the full upvotes array to the client
issueSchema.virtual('upvoteCount').get(function () {
  return this.upvotes.length;
});

issueSchema.set('toJSON', { virtuals: true });
issueSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Issue', issueSchema);
