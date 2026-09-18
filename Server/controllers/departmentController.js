const asyncHandler = require('express-async-handler');
const Department = require('../models/Department');
const User = require('../models/User');
const AppError = require('../utils/AppError');

// @desc   List all active departments (used to populate category dropdowns)
// @route  GET /api/departments
// @access Public
const getDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find({ isActive: true })
    .populate('headAdmin', 'name email')
    .sort({ name: 1 });

  res.status(200).json({ success: true, data: departments });
});

// @desc   Create a new department
// @route  POST /api/departments
// @access Super Admin
const createDepartment = asyncHandler(async (req, res, next) => {
  const { name, description, headAdmin } = req.body;

  if (headAdmin) {
    const user = await User.findById(headAdmin);
    if (!user) {
      return next(new AppError('headAdmin does not reference an existing user', 400));
    }
    // Not enforcing user.role === 'dept_admin' here on purpose — a Super
    // Admin may create the department before promoting the user via
    // PATCH /api/users/:id/role. Syncing User.department to match
    // also happens there, not here, to keep the two write paths independent.
  }

  try {
    const department = await Department.create({
      name,
      description,
      headAdmin: headAdmin || null,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: department });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError('A department with this name already exists', 409));
    }
    throw error;
  }
});

// @desc   Update name, description, or head admin
// @route  PATCH /api/departments/:id
// @access Super Admin
const updateDepartment = asyncHandler(async (req, res, next) => {
  const department = await Department.findById(req.params.id);
  if (!department) {
    return next(new AppError('Department not found', 404));
  }

  if (req.body.headAdmin) {
    const user = await User.findById(req.body.headAdmin);
    if (!user) {
      return next(new AppError('headAdmin does not reference an existing user', 400));
    }
  }

  Object.assign(department, req.body);

  try {
    await department.save();
    res.status(200).json({ success: true, message: 'Department updated', data: department });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError('A department with this name already exists', 409));
    }
    throw error;
  }
});

// @desc   Soft delete (isActive = false)
// @route  DELETE /api/departments/:id
// @access Super Admin
const deleteDepartment = asyncHandler(async (req, res, next) => {
  const department = await Department.findById(req.params.id);
  if (!department) {
    return next(new AppError('Department not found', 404));
  }

  department.isActive = false;
  await department.save();

  res.status(200).json({ success: true, message: 'Department deactivated' });
});

module.exports = { getDepartments, createDepartment, updateDepartment, deleteDepartment };
