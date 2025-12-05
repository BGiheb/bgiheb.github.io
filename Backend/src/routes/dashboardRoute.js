const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/stats', authMiddleware, dashboardController.getDashboardStats);
router.get('/recent-classes', authMiddleware, dashboardController.getRecentClasses);

module.exports = router;