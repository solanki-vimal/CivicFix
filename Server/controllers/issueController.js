// Deferred to a later phase, not built here:
// - GET /api/issues/analytics/summary — needs real aggregation data, same
//   reasoning as departmentController.js deferring dept analytics
//
// Comments (POST/GET /api/issues/:id/comments) live in
// controllers/commentController.js, routes/commentRoutes.js — nested under
// /:id/comments in routes/issueRoutes.js.
//
// Image handling (Multer/Cloudinary) is wired into createIssue below via
// utils/uploadToCloudinary.js — no longer deferred.

const asyncHandler = require('express-async-handler');
const Issue = require('../models/Issue');
const StatusHistory = require('../models/StatusHistory');
const AppError = require('../utils/AppError');
const { resolveDepartmentForCategory } = require('./categoryController');
const { uploadIssueImages } = require('../utils/uploadToCloudinary');
const { emitToIssueRoom, emitGlobal } = require('../config/socket');


const populateIssueRefs = (query) =>
  query
    .populate('category', 'name color icon')
    .populate('department', 'name')
    .populate('reportedBy', 'name avatar')
    .populate('assignedTo', 'name avatar');

// @desc   Create a new issue — auto-routed to a department via its category
// @route  POST /api/issues
// @access Citizen
const createIssue = asyncHandler(async (req, res, next) => {
  const { title, description, category, location, address } = req.body;

  // This is the auto-routing mechanism itself: the department is derived
  // from the category, never trusted from the client body.
  let department;
  try {
    department = await resolveDepartmentForCategory(category);
  } catch (error) {
    return next(error); // AppError from resolveDepartmentForCategory (400)
  }

  const issue = await Issue.create({
    title,
    description,
    category,
    department,
    reportedBy: req.user._id,
    location: { coordinates: [location.lng, location.lat] },
    address,
    images,
  });

  // First StatusHistory entry — fromStatus null, marking the issue's creation.
  await StatusHistory.create({
    issue: issue._id,
    fromStatus: null,
    toStatus: 'pending',
    changedBy: req.user._id,
  });

  // Admin dashboard: new issue counter increments live
  emitGlobal('newIssue', { issueId: issue._id, title: issue.title, department: issue.department });

  res.status(201).json({ success: true, data: issue });
});

// @desc   List issues with filters: category, status, department,
//         lng/lat/radius (geospatial), page, limit
// @route  GET /api/issues
// @access Public
const getIssues = asyncHandler(async (req, res) => {
  const { category, status, department, lng, lat, radius, page, limit } = req.query;

  const filter = {};
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (department) filter.department = department;

  const usingGeo = lng !== undefined && lat !== undefined;
  if (usingGeo) {
    filter.location = {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: radius,
      },
    };
  }

  const skip = (page - 1) * limit;

  let query = Issue.find(filter).skip(skip).limit(limit);
  // $near already sorts by distance — an explicit sort would conflict with it,
  // so only apply the default newest-first sort when no geo filter is active.
  if (!usingGeo) {
    query = query.sort({ createdAt: -1 });
  }
  query = populateIssueRefs(query);

  const [issues, total] = await Promise.all([query, Issue.countDocuments(filter)]);

  res.status(200).json({
    success: true,
    data: issues,
    pagination: { page, limit, total },
  });
});

// @desc   The logged-in citizen's own reported issues
// @route  GET /api/issues/mine
// @access Citizen
const getMyIssues = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = { reportedBy: req.user._id };

  const [issues, total] = await Promise.all([
    populateIssueRefs(Issue.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)),
    Issue.countDocuments(filter),
  ]);

  res.status(200).json({ success: true, data: issues, pagination: { page, limit, total } });
});

// @desc   Full issue detail with populated refs
// @route  GET /api/issues/:id
// @access Public
const getIssueById = asyncHandler(async (req, res, next) => {
  const issue = await populateIssueRefs(Issue.findById(req.params.id));
  if (!issue) {
    return next(new AppError('Issue not found', 404));
  }
  res.status(200).json({ success: true, data: issue });
});

// @desc   Update status, assignee, priority, or rejection reason.
//         Writes a StatusHistory record for every change. Staff and Dept
//         Admins are scoped to their own department; Super Admin can update
//         any issue — this scoping isn't spelled out in the API doc's
//         endpoint table, but matches the role permissions described in
//         section 2 of the project doc (Staff/Dept Admin act within their
//         own department).
// @route  PATCH /api/issues/:id/status
// @access Staff / Dept Admin / Super Admin
const updateIssueStatus = asyncHandler(async (req, res, next) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) {
    return next(new AppError('Issue not found', 404));
  }

  if (
    req.user.role !== 'super_admin' &&
    (!req.user.department || String(req.user.department) !== String(issue.department))
  ) {
    return next(new AppError('You can only update issues within your own department', 403));
  }

  const { status, assignedTo, priority, rejectionReason, note } = req.body;
  const fromStatus = issue.status;

  if (status) issue.status = status;
  if (assignedTo !== undefined) issue.assignedTo = assignedTo;
  if (priority) issue.priority = priority;
  if (status === 'rejected') issue.rejectionReason = rejectionReason;
  if (status === 'resolved') issue.resolvedAt = new Date();

  await issue.save();

  // Only write a StatusHistory entry when the status actually changed —
  // an assignee/priority-only update doesn't belong in the status timeline.
  if (status && status !== fromStatus) {
    await StatusHistory.create({
      issue: issue._id,
      fromStatus,
      toStatus: status,
      changedBy: req.user._id,
      note: status === 'rejected' ? rejectionReason : note,
    });

    // Real-time: anyone with this issue's detail page open updates live,
    // no refresh needed
    emitToIssueRoom(issue._id, 'statusUpdate', {
      issueId: issue._id,
      fromStatus,
      toStatus: status,
      changedAt: new Date(),
    });
  }

  const populated = await populateIssueRefs(Issue.findById(issue._id));
  res.status(200).json({ success: true, message: 'Status updated', data: populated });
});

// @desc   Toggle upvote — adds or removes the current user from the upvotes array
// @route  PATCH /api/issues/:id/upvote
// @access Citizen
const toggleUpvote = asyncHandler(async (req, res, next) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) {
    return next(new AppError('Issue not found', 404));
  }

  const userId = String(req.user._id);
  const alreadyUpvoted = issue.upvotes.some((id) => String(id) === userId);

  if (alreadyUpvoted) {
    issue.upvotes.pull(req.user._id);
  } else {
    issue.upvotes.push(req.user._id);
  }
  await issue.save();

  res.status(200).json({ success: true, data: { upvoteCount: issue.upvotes.length } });
});

module.exports = { createIssue, getIssues, getMyIssues, getIssueById, updateIssueStatus, toggleUpvote };
