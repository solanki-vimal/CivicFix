const express = require('express');
const router = express.Router();

const { getSummary, getLocations } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');
const { validateQuery } = require('../middleware/validate');
const { analyticsQuerySchema } = require('../validators/analyticsValidators');

router.use(protect, authorize('super_admin', 'dept_admin'));

router.get('/summary', validateQuery(analyticsQuerySchema), getSummary);
router.get('/locations', validateQuery(analyticsQuerySchema), getLocations);

module.exports = router;
