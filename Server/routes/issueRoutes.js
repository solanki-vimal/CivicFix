// IMPORTANT: GET /mine is registered before GET /:id — otherwise Express
// would match "mine" against the :id param pattern and never reach the
// dedicated handler.

const express = require('express');
const router = express.Router();

const {
  createIssue,
  getIssues,
  getMyIssues,
  getIssueById,
  updateIssueStatus,
  toggleUpvote,
} = require('../controllers/issueController');

const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { validateQuery } = require('../middleware/validate');
const upload = require('../middleware/upload');
const {
  createIssueSchema,
  updateStatusSchema,
  listIssuesQuerySchema,
} = require('../validators/issueValidators');

router.post(
  '/', 
  protect, 
  authorize('citizen'), 
  upload.array('images', 5),
  validate(createIssueSchema),  
  createIssue
);
router.get('/', validateQuery(listIssuesQuerySchema), getIssues);
router.get('/mine', protect, authorize('citizen'), getMyIssues);
router.get('/:id', getIssueById);
router.patch(
  '/:id/status',
  protect,
  authorize('staff', 'dept_admin', 'super_admin'),
  validate(updateStatusSchema),
  updateIssueStatus
);
router.patch('/:id/upvote', protect, authorize('citizen'), toggleUpvote);
router.use('/:id/comments', require('./commentRoutes'));

module.exports = router;
