const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authMiddleware = require("../middleware/authMiddleware");
const { restrictTo } = require('../middleware/roleMiddleware');

// Voir tous les étudiants : TEACHER, INSTRUCTOR, ADMIN, COORDINATOR, INSPECTOR
router.get('/students', authMiddleware, restrictTo('TEACHER', 'ADMIN', 'INSTRUCTOR', 'COORDINATOR', 'INSPECTOR'), studentController.getAllStudents);
// Inviter des étudiants : TEACHER, INSTRUCTOR, ADMIN seulement
router.post('/invite', authMiddleware, restrictTo('TEACHER', 'ADMIN', 'INSTRUCTOR'), studentController.inviteStudent);

module.exports = router;