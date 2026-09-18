const asyncHandler = require('express-async-handler');
const Category = require('../models/Category');
const Department = require('../models/Department');
const AppError = require('../utils/AppError');

// @desc   List all active categories, optionally filtered to one department
//         (?department=<id> — used to populate a department-scoped dropdown)
// @route  GET /api/categories
// @access Public
const getCategories = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.department) {
    filter.department = req.query.department;
  }

  const categories = await Category.find(filter)
    .populate('department', 'name')
    .sort({ name: 1 });

  res.status(200).json({ success: true, data: categories });
});

// @desc   Create a category linked to a department
// @route  POST /api/categories
// @access Super Admin
const createCategory = asyncHandler(async (req, res, next) => {
  const { name, icon, color, department } = req.body;

  const dept = await Department.findById(department);
  if (!dept || !dept.isActive) {
    return next(new AppError('department must reference an existing, active department', 400));
  }

  try {
    const category = await Category.create({
      name,
      icon,
      color,
      department,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError('A category with this name already exists in this department', 409));
    }
    throw error;
  }
});

// @desc   Edit a category, or re-map it to a different department —
//         re-routing takes effect immediately for any issue submitted
//         AFTER the change.
// @route  PATCH /api/categories/:id
// @access Super Admin
const updateCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  if (req.body.department) {
    const dept = await Department.findById(req.body.department);
    if (!dept || !dept.isActive) {
      return next(new AppError('department must reference an existing, active department', 400));
    }
  }

  Object.assign(category, req.body);

  try {
    await category.save();
    res.status(200).json({ success: true, message: 'Category updated', data: category });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError('A category with this name already exists in this department', 409));
    }
    throw error;
  }
});

// @desc   Soft delete (isActive = false)
// @route  DELETE /api/categories/:id
// @access Super Admin
const deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  category.isActive = false;
  await category.save();

  res.status(200).json({ success: true, message: 'Category deactivated' });
});

// Resolves which department a category currently routes to. This is the
// auto-routing mechanism itself — issue-creation controller will
// call this to set Issue.department from the citizen's chosen category.
// Exported (not used within this file) so that consumer can be built later
// without duplicating the active-category check here.
const resolveDepartmentForCategory = async (categoryId) => {
  const category = await Category.findById(categoryId);
  if (!category || !category.isActive) {
    throw new AppError('category must reference an existing, active category', 400);
  }
  return category.department;
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  resolveDepartmentForCategory,
};
