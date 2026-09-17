// Issue categories. The `department` reference here is the auto-routing
// key: when a citizen submits an issue under this category, the issue's
// department is copied from category.department at creation time.

const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    icon: {
      type: String,
      trim: true,
      default: '',
    },
    color: {
      type: String,
      trim: true,
      default: '#6B7280', // neutral gray fallback if not set
      match: [/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Color must be a valid hex code'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'A category must belong to a department'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'createdBy is required'],
    },
  },
  { timestamps: true }
);

// department is listed first so this index also serves "list categories in
// department X" queries (the common case — populating a dept's category
// dropdown) via prefix match, not just the exact name+department lookup.
// Still enforces: no duplicate category name within the same department.
categorySchema.index({ department: 1, name: 1 }, { unique: true });

// GET /api/categories (public) filters isActive: true across all departments
categorySchema.index({ isActive: 1 });

module.exports = mongoose.model('Category', categorySchema);
