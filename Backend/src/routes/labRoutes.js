const express = require('express');
const router = express.Router();
const labController = require('../controllers/labController');
const authMiddleware = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

// Toutes les routes nécessitent une authentification et le rôle INSTRUCTOR ou ADMIN
router.get('/my-labs', authMiddleware, restrictTo('INSTRUCTOR', 'ADMIN'), labController.getMyLabs);
router.post('/create', authMiddleware, restrictTo('INSTRUCTOR', 'ADMIN'), labController.createLab);
router.post('/:labId/launch', authMiddleware, restrictTo('INSTRUCTOR', 'ADMIN'), labController.launchLab);
router.post('/:labId/stop', authMiddleware, restrictTo('INSTRUCTOR', 'ADMIN'), labController.stopLab);
router.delete('/:labId', authMiddleware, restrictTo('INSTRUCTOR', 'ADMIN'), labController.deleteLab);
router.get('/:labId/status', authMiddleware, restrictTo('INSTRUCTOR', 'ADMIN'), labController.getLabStatus);

module.exports = router;

