// Aggregation pipelines for the dashboards, each taking a base `match` so the
// same pipelines serve both city-wide ({}) and one department ({ department }).
//
// IMPORTANT: Mongoose does not cast IDs inside aggregate() the way it does in
// find(), so `match.department` must already be an ObjectId — callers pass a
// department document's own _id, never a raw string from the request.

const UNRESOLVED = ['pending', 'open', 'in_progress'];
const RESOLUTION_HOURS = { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 3600000] };

const byCategory = (match) => [
  { $match: match },
  { $group: { _id: '$category', count: { $sum: 1 } } },
  { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
  { $unwind: '$category' },
  { $project: { _id: 0, category: '$category.name', color: '$category.color', count: 1 } },
  { $sort: { count: -1, category: 1 } },
];

const byStatus = (match) => [{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }];

const weekly = (match, windowStart) => [
  { $match: { ...match, createdAt: { $gte: windowStart } } },
  {
    $group: {
      _id: { isoWeek: { $isoWeek: '$createdAt' }, isoYear: { $isoWeekYear: '$createdAt' } },
      count: { $sum: 1 },
    },
  },
  { $project: { _id: 0, week: '$_id.isoWeek', year: '$_id.isoYear', count: 1 } },
];

const avgResolution = (match) => [
  { $match: { ...match, status: 'resolved', resolvedAt: { $ne: null } } },
  { $project: { hours: RESOLUTION_HOURS } },
  { $group: { _id: null, avgHours: { $avg: '$hours' } } },
];

// City-wide only: one row per department.
const departmentPerformance = () => [
  {
    $group: {
      _id: '$department',
      total: { $sum: 1 },
      resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
      avgResolutionHours: {
        $avg: { $cond: [{ $eq: ['$status', 'resolved'] }, RESOLUTION_HOURS, null] },
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
  { $sort: { total: -1 } },
];

// Unresolved issues that have at least one upvote — a zero-upvote issue
// isn't "most upvoted" anything, so it would only be noise in this list.
const topUnresolved = (match) => [
  { $match: { ...match, status: { $in: UNRESOLVED } } },
  { $addFields: { upvoteCount: { $size: { $ifNull: ['$upvotes', []] } } } },
  { $match: { upvoteCount: { $gt: 0 } } },
  { $sort: { upvoteCount: -1, createdAt: -1 } },
  { $limit: 5 },
  { $project: { _id: 1, title: 1, status: 1, upvoteCount: 1 } },
];

// Active work per assignee within one department: anything assigned and not
// yet resolved or rejected.
const staffWorkload = (departmentId) => [
  { $match: { department: departmentId, status: { $in: UNRESOLVED }, assignedTo: { $ne: null } } },
  { $group: { _id: '$assignedTo', openCount: { $sum: 1 } } },
  { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'staff' } },
  { $unwind: '$staff' },
  { $project: { _id: 0, staffId: '$staff._id', name: '$staff.name', openCount: 1 } },
];

module.exports = { UNRESOLVED, byCategory, byStatus, weekly, avgResolution, departmentPerformance, topUnresolved, staffWorkload };
