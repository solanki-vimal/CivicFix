const asyncHandler = require('express-async-handler');
const Department = require('../models/Department');
const Issue = require('../models/Issue');
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

// @desc   Department-scoped analytics: open issue count, resolved this
//         month vs last month, and staff workload (open issues per
//         assigned staff member).
// @route  GET /api/departments/:id/analytics
// @access Dept Admin (own department only) / Super Admin (any department)
const getDepartmentAnalytics = asyncHandler(async (req, res, next) => {
  const department = await Department.findById(req.params.id);
  if (!department) {
    return next(new AppError('Department not found', 404));
  }

  // A Dept Admin can only view their own department's analytics; Super
  // Admin can view any. Same scoping pattern used in
  // issueController.js's updateIssueStatus.
  if (
    req.user.role !== 'super_admin' &&
    (!req.user.department || String(req.user.department) !== String(department._id))
  ) {
    return next(new AppError('You can only view analytics for your own department', 403));
  }

  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [openIssues, resolvedThisMonth, resolvedLastMonth, staffWorkloadRaw] = await Promise.all([
    Issue.countDocuments({
      department: department._id,
      status: { $in: ['pending', 'open', 'in_progress'] },
    }),
    Issue.countDocuments({
      department: department._id,
      status: 'resolved',
      resolvedAt: { $gte: startOfThisMonth },
    }),
    Issue.countDocuments({
      department: department._id,
      status: 'resolved',
      resolvedAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
    }),
    Issue.aggregate([
      {
        $match: {
          department: department._id,
          status: 'in_progress',
          assignedTo: { $ne: null },
        },
      },
      { $group: { _id: '$assignedTo', openCount: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'staff' } },
      { $unwind: '$staff' },
      { $project: { _id: 0, staffId: '$staff._id', name: '$staff.name', openCount: 1 } },
      { $sort: { openCount: -1 } },
    ]),
  ]);

  res.status(200).json({
    success: true,
    data: {
      openIssues,
      resolvedThisMonth,
      resolvedLastMonth,
      staffWorkload: staffWorkloadRaw,
    },
  });
});

module.exports = { getDepartments, createDepartment, updateDepartment, deleteDepartment, getDepartmentAnalytics };
