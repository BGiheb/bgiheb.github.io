const express = require('express');
const router = express.Router();
const ragController = require('../controllers/ragController');
const authMiddleware = require('../middleware/authMiddleware');
const { isTeacherOrStudentInClass } = require('../middleware/roleMiddleware');

// Middleware personnalisé pour extraire classId de la route
const extractClassId = (req, res, next) => {
  req.params.classId = req.params.classId;
  req.body.classId = req.params.classId;
  next();
};

// Route pour générer une réponse RAG
router.post('/class/:classId/chat', authMiddleware, extractClassId, isTeacherOrStudentInClass, ragController.generateRAGResponse);

// Route de diagnostic pour vérifier l'état du RAG
router.get('/class/:classId/status', authMiddleware, extractClassId, isTeacherOrStudentInClass, ragController.checkRAGStatus);

module.exports = router;

