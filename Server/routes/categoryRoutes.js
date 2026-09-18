const express = require('express');
const router = express.Router();

const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');

const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createCategorySchema, updateCategorySchema } = require('../validators/categoryValidators');

router.get('/', getCategories);
router.post('/', protect, authorize('super_admin'), validate(createCategorySchema), createCategory);
router.patch('/:id', protect, authorize('super_admin'), validate(updateCategorySchema), updateCategory);
router.delete('/:id', protect, authorize('super_admin'), deleteCategory);

module.exports = router;
