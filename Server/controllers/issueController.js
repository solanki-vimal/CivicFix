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

  // req.files comes from the upload.array('images', 3) middleware in
  // issueRoutes.js — already validated for type/size/count by Multer.
  const images = await uploadIssueImages(req.files);

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


// @desc   Aggregated city-wide analytics: issues by category/status,
//         weekly trend (last 12 weeks), average resolution time overall
//         and per department, and the top 5 unresolved issues by upvotes.
// @route  GET /api/issues/analytics/summary
// @access Super Admin
const getIssuesAnalyticsSummary = asyncHandler(async (req, res) => {
  const twelveWeeksAgo = new Date();
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 12 * 7);

  const [byCategoryRaw, byStatusRaw, weeklyTrendRaw, avgResolutionRaw, departmentPerformanceRaw, topUpvotedRaw] =
    await Promise.all([
      // Issues by category
      Issue.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
        { $unwind: '$category' },
        { $project: { _id: 0, category: '$category.name', count: 1 } },
        { $sort: { count: -1 } },
      ]),
      // Issues by status
      Issue.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      // Issues per week, last 12 weeks
      Issue.aggregate([
        { $match: { createdAt: { $gte: twelveWeeksAgo } } },
        {
          $group: {
            _id: { isoWeek: { $isoWeek: '$createdAt' }, isoYear: { $isoWeekYear: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.isoYear': 1, '_id.isoWeek': 1 } },
        { $project: { _id: 0, week: '$_id.isoWeek', year: '$_id.isoYear', count: 1 } },
      ]),
      // Overall average resolution time, in hours
      Issue.aggregate([
        { $match: { status: 'resolved', resolvedAt: { $ne: null } } },
        { $project: { hours: { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 3600000] } } },
        { $group: { _id: null, avgHours: { $avg: '$hours' } } },
      ]),
      // Per-department performance: total, resolved, avg resolution hours
      Issue.aggregate([
        {
          $group: {
            _id: '$department',
            total: { $sum: 1 },
            resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
            avgResolutionHours: {
              $avg: {
                $cond: [
                  { $eq: ['$status', 'resolved'] },
                  { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 3600000] },
                  null,
                ],
              },
            },
          },
        },
        { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'department' } },
        { $unwind: '$department' },
        {
          $project: {
            _id: 0,
            department: '$department.name',
            total: 1,
            resolved: 1,
            avgResolutionHours: { $round: [{ $ifNull: ['$avgResolutionHours', 0] }, 1] },
          },
        },
      ]),
      // Top 5 most-upvoted unresolved issues
      Issue.aggregate([
        { $match: { status: { $nin: ['resolved', 'rejected'] } } },
        { $addFields: { upvoteCount: { $size: '$upvotes' } } },
        { $sort: { upvoteCount: -1 } },
        { $limit: 5 },
        { $project: { _id: 1, title: 1, status: 1, upvoteCount: 1 } },
      ]),
    ]);

  // byStatus comes back as an array of { _id, count } — reshape into a flat
  // object with every status present (even at 0), so the frontend chart
  // doesn't have to guard against missing keys.
  const byStatus = { pending: 0, open: 0, in_progress: 0, resolved: 0, rejected: 0 };
  byStatusRaw.forEach((row) => {
    byStatus[row._id] = row.count;
  });

  res.status(200).json({
    success: true,
    data: {
      byCategory: byCategoryRaw,
      byStatus,
      weeklyTrend: weeklyTrendRaw,
      avgResolutionHours: avgResolutionRaw[0] ? Math.round(avgResolutionRaw[0].avgHours * 10) / 10 : 0,
      departmentPerformance: departmentPerformanceRaw,
      topUnresolvedByUpvotes: topUpvotedRaw,
    },
  });
});

module.exports = {
  createIssue,
  getIssues,
  getMyIssues,
  getIssueById,
  updateIssueStatus,
  toggleUpvote,
  getIssuesAnalyticsSummary,
};
