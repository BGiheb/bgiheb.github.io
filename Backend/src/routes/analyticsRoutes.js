const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const classAnalyticsController = require('../controllers/classAnalyticsController');
const authMiddleware = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

// Dashboard analytics : TEACHER, INSTRUCTOR, ADMIN, COORDINATOR, INSPECTOR
router.get('/dashboard', authMiddleware, restrictTo('TEACHER', 'ADMIN', 'INSTRUCTOR', 'COORDINATOR', 'INSPECTOR'), analyticsController.getAnalyticsData);

// Class-specific analytics : TEACHER, INSTRUCTOR, ADMIN, COORDINATOR, INSPECTOR
router.get('/class/:classId', authMiddleware, restrictTo('TEACHER', 'ADMIN', 'INSTRUCTOR', 'COORDINATOR', 'INSPECTOR'), classAnalyticsController.getClassAnalytics);

module.exports = router;