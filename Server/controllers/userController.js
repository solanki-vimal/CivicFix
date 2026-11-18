// - GET /api/users is also open to dept_admin (scoped to the staff of their
//   own department) because assigning an issue needs a list of assignable staff.
// - PATCH /api/users/:id/role also keeps Department.headAdmin consistent.

const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Department = require('../models/Department');
const AppError = require('../utils/AppError');

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc   List users with filters (role, department, isActive, search by
//         name/email) and pagination. Dept admins only ever see the staff of
//         their own department, whatever filters they pass.
// @route  GET /api/users
// @access Super Admin / Dept Admin
const getUsers = asyncHandler(async (req, res, next) => {
  const { role, department, isActive, search, page, limit } = req.query;
  const filter = {};

  if (req.user.role === 'dept_admin') {
    if (!req.user.department) {
      return next(new AppError('Your account is not assigned to a department', 403));
    }
    filter.department = req.user.department;
    filter.role = 'staff';
  } else {
    if (role) filter.role = role;
    if (department) filter.department = department;
  }

  if (isActive !== undefined) filter.isActive = isActive === 'true';

  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: pattern }, { email: pattern }];
  }

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(filter)
      .select('name email role department isActive avatar createdAt lastLogin')
      .populate('department', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  res.status(200).json({ success: true, data: users, pagination: { page, limit, total } });
});

// @desc   Change a user's role (and department)
// @route  PATCH /api/users/:id/role
// @access Super Admin
const updateUserRole = asyncHandler(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid user ID', 400));
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Stops a super admin from demoting themselves and leaving the platform
  // with nobody able to manage users.
  if (String(user._id) === String(req.user._id)) {
    return next(new AppError('You cannot change your own role', 400));
  }

  const { role } = req.body;
  let department = null;

  if (role === 'staff' || role === 'dept_admin') {
    const found = await Department.findById(req.body.department);
    if (!found || !found.isActive) {
      return next(new AppError('department must reference an existing, active department', 400));
    }
    department = found._id;
  }
  // citizen and super_admin never belong to a department, so it stays null.

  user.role = role;
  user.department = department;
  await user.save();

  // Keep Department.headAdmin consistent with the new role:
  // 1) anyone who used to head a department they no longer head is cleared;
  await Department.updateMany(
    { headAdmin: user._id, ...(role === 'dept_admin' ? { _id: { $ne: department } } : {}) },
    { headAdmin: null }
  );
  // 2) a new dept admin becomes head only if the post is vacant — an existing
  //    head isn't silently displaced.
  if (role === 'dept_admin') {
    await Department.updateOne({ _id: department, headAdmin: null }, { headAdmin: user._id });
  }

  await user.populate('department', 'name');

  res.status(200).json({
    success: true,
    message: 'Role updated',
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || null,
      isActive: user.isActive,
    },
  });
});

module.exports = { getUsers, updateUserRole };
