const express = require('express');
const router = express.Router();

const {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentAnalytics,
} = require('../controllers/departmentController');

const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createDepartmentSchema, updateDepartmentSchema } = require('../validators/departmentValidators');

router.get('/', getDepartments);
router.post('/', protect, authorize('super_admin'), validate(createDepartmentSchema), createDepartment);
router.patch('/:id', protect, authorize('super_admin'), validate(updateDepartmentSchema), updateDepartment);
router.delete('/:id', protect, authorize('super_admin'), deleteDepartment);
router.get('/:id/analytics', protect, authorize('super_admin'), getDepartmentAnalytics);

module.exports = router;
