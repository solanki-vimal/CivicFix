const express = require('express');
const router = express.Router();

const { getUsers, updateUserRole } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { validateQuery } = require('../middleware/validate');
const { listUsersQuerySchema, updateRoleSchema } = require('../validators/userValidators');

router.use(protect);

router.get('/', authorize('super_admin', 'dept_admin'), validateQuery(listUsersQuerySchema), getUsers);
router.patch('/:id/role', authorize('super_admin'), validate(updateRoleSchema), updateUserRole);

module.exports = router;
