// Powers the admin dashboards. One summary endpoint serves both views:
// city-wide for a super admin, one department for a dept admin (or a super
// admin who picks a department). This supersedes
// GET /api/issues/analytics/summary and GET /api/departments/:id/analytics,
// which only covered parts of the dashboards' needs; those are left untouched.

const asyncHandler = require('express-async-handler');
const Issue = require('../models/Issue');
const Department = require('../models/Department');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const pipelines = require('../utils/analyticsPipelines');
const { getTrendWindow, fillWeeklyTrend, getMonthBounds } = require('../utils/dateRanges');

const MAX_LOCATIONS = 2000;

// Works out which department (if any) this request is scoped to.
// Returns a Department document, or null for city-wide.
const resolveScope = async (req) => {
  const requested = req.query.department;

  if (req.user.role === 'dept_admin') {
    if (!req.user.department) {
      throw new AppError('Your account is not assigned to a department', 403);
    }
    if (requested && String(requested) !== String(req.user.department)) {
      throw new AppError('You can only view analytics for your own department', 403);
    }
    const own = await Department.findById(req.user.department);
    if (!own) throw new AppError('Department not found', 404);
    return own;
  }

  if (!requested) return null;
  const department = await Department.findById(requested);
  if (!department) throw new AppError('Department not found', 404);
  return department;
};

// @desc   Dashboard analytics, city-wide or for one department
// @route  GET /api/analytics/summary?department=<id>
// @access Super Admin / Dept Admin
const getSummary = asyncHandler(async (req, res) => {
  const department = await resolveScope(req);
  const match = department ? { department: department._id } : {};

  const trendWindow = getTrendWindow();
  const { startOfThisMonth, startOfLastMonth } = getMonthBounds();

  const [
    byCategory,
    byStatusRows,
    weeklyRows,
    avgResolutionRows,
    departmentPerformance,
    topUnresolvedByUpvotes,
    resolvedThisMonth,
    resolvedLastMonth,
    workloadRows,
    staffList,
  ] = await Promise.all([
    Issue.aggregate(pipelines.byCategory(match)),
    Issue.aggregate(pipelines.byStatus(match)),
    Issue.aggregate(pipelines.weekly(match, trendWindow[0])),
    Issue.aggregate(pipelines.avgResolution(match)),
    department ? Promise.resolve([]) : Issue.aggregate(pipelines.departmentPerformance()),
    Issue.aggregate(pipelines.topUnresolved(match)),
    Issue.countDocuments({ ...match, status: 'resolved', resolvedAt: { $gte: startOfThisMonth } }),
    Issue.countDocuments({ ...match, status: 'resolved', resolvedAt: { $gte: startOfLastMonth, $lt: startOfThisMonth } }),
    department ? Issue.aggregate(pipelines.staffWorkload(department._id)) : Promise.resolve([]),
    department
      ? User.find({ department: department._id, role: 'staff', isActive: true }).select('name').lean()
      : Promise.resolve([]),
  ]);

  // Every status present, even at 0, so a chart never has to guard against a missing key.
  const byStatus = { pending: 0, open: 0, in_progress: 0, resolved: 0, rejected: 0 };
  byStatusRows.forEach((row) => {
    byStatus[row._id] = row.count;
  });
  const total = Object.values(byStatus).reduce((sum, n) => sum + n, 0);

  // Staff with no active work still belong on a workload view — a dept admin
  // is looking for who has capacity, not just who is busy.
  const workload = new Map(workloadRows.map((row) => [String(row.staffId), row]));
  staffList.forEach((staff) => {
    if (!workload.has(String(staff._id))) {
      workload.set(String(staff._id), { staffId: staff._id, name: staff.name, openCount: 0 });
    }
  });
  const staffWorkload = [...workload.values()].sort(
    (a, b) => b.openCount - a.openCount || a.name.localeCompare(b.name)
  );

  res.status(200).json({
    success: true,
    data: {
      scope: { department: department ? { _id: department._id, name: department.name } : null },
      totals: {
        total,
        open: byStatus.pending + byStatus.open + byStatus.in_progress,
        resolvedThisMonth,
        resolvedLastMonth,
      },
      byCategory,
      byStatus,
      weeklyTrend: fillWeeklyTrend(trendWindow, weeklyRows),
      avgResolutionHours: avgResolutionRows[0] ? Math.round(avgResolutionRows[0].avgHours * 10) / 10 : 0,
      departmentPerformance,
      topUnresolvedByUpvotes,
      staffWorkload,
    },
  });
});

// @desc   Issue coordinates for the density map, newest first, capped
// @route  GET /api/analytics/locations?department=<id>
// @access Super Admin / Dept Admin
const getLocations = asyncHandler(async (req, res) => {
  const department = await resolveScope(req);
  const match = department ? { department: department._id } : {};

  const issues = await Issue.find(match)
    .select('location status')
    .sort({ createdAt: -1 })
    .limit(MAX_LOCATIONS)
    .lean();

  const data = issues
    .filter((issue) => issue.location && issue.location.coordinates && issue.location.coordinates.length === 2)
    .map((issue) => ({
      lng: issue.location.coordinates[0],
      lat: issue.location.coordinates[1],
      status: issue.status,
    }));

  res.status(200).json({ success: true, data });
});

module.exports = { getSummary, getLocations };
