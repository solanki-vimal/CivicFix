// All user accounts regardless of role (citizen, staff, dept_admin, super_admin).
// Supports both email/password and Google OAuth — exactly one identity method
// is expected to be set per user, the other stays null.

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      select: false, // never returned in queries unless explicitly requested
      // No `default: null` — a field that's simply absent (not present-with-null)
      // is required for Google-only accounts to skip password hashing cleanly.
    },
    googleId: {
      type: String,
      // No `default: null` — this field must be truly ABSENT for non-Google
      // users, not present with value null. A sparse index only skips
      // documents where the field is missing; if Mongoose sets it to null
      // on every save (via a default), every citizen collides on
      // { googleId: null } and signup breaks with an E11000 error.
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['citizen', 'staff', 'dept_admin', 'super_admin'],
      default: 'citizen',
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null, // null for citizen and super_admin
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    resetPasswordToken: {
      type: String,
      select: false,
      // No `default: null` — same reasoning as googleId above: this field
      // is sparse-indexed, so it must be absent (not null) for users who
      // haven't requested a password reset.
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);

// ─── Indexes

// Every Google login does User.findOne({ googleId }) — needs its own index
// rather than a collection scan. `sparse` skips the (many) users where
// googleId is null, so it doesn't force uniqueness on a field most users don't have.
userSchema.index({ googleId: 1 }, { unique: true, sparse: true });

// resetPassword flow does User.findOne({ resetPasswordToken, resetPasswordExpires }) —
// sparse since almost every user has this as null at any given time.
userSchema.index({ resetPasswordToken: 1 }, { sparse: true });

// Super Admin's user management screen (GET /api/users) filters by role and
// department together — e.g. "all staff in the Roads department" for
// assigning issues. Compound so department-only queries can also use it
// (department as the leading field serves both cases).
userSchema.index({ department: 1, role: 1 });

// Hash the password before saving — only runs when password is new/changed,
// and only when a password actually exists (skip for Google-only accounts).
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method used by the Passport local strategy at login.
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false; // Google-only account, no password set
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
