// Municipal departments created by Super Admin. Categories link to a
// department (the auto-routing key), and issues carry a copy of that
// department reference at creation time.

const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    headAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // expected to reference a user with role 'dept_admin'
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'createdBy is required'], // expected to be a super_admin
    },
  },
  { timestamps: true }
);

// Public GET /api/departments always filters isActive: true (populates
// category dropdowns, only active departments should ever be citizen-facing)
departmentSchema.index({ isActive: 1 });

module.exports = mongoose.model('Department', departmentSchema);
