const express = require('express')
const {protect} = require('../middleware/authMiddleware');
const {
	getDashboardData,
	getMonthlyComparison,
} = require('../controllers/dashboardController')

const router = express.Router();

router.get('/monthly-comparison', protect, getMonthlyComparison);
router.get('/', protect, getDashboardData);

module.exports = router;