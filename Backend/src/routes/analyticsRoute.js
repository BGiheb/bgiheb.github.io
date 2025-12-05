const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require("../middleware/authMiddleware");

router.get('/data', authMiddleware,analyticsController.getAnalyticsData);

module.exports = router;