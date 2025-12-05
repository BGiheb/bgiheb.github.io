const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require("../middleware/authMiddleware");
const { restrictTo } = require('../middleware/roleMiddleware');

// Conversations : Tous les utilisateurs authentifiés
router.get('/conversations', authMiddleware, messageController.getConversations);
router.get('/messages/:conversationId', authMiddleware, messageController.getMessages);
// Envoyer des messages : Tous sauf INSPECTOR (lecture seule)
router.post('/messages', authMiddleware, restrictTo('TEACHER', 'ADMIN', 'INSTRUCTOR', 'COORDINATOR', 'STUDENT'), messageController.sendMessage);
// Voir les étudiants : TEACHER, INSTRUCTOR, ADMIN, COORDINATOR, INSPECTOR
router.get('/students', authMiddleware, restrictTo('TEACHER', 'ADMIN', 'INSTRUCTOR', 'COORDINATOR', 'INSPECTOR'), messageController.getStudentsByClasses);
// Créer des conversations de groupe : TEACHER, INSTRUCTOR, ADMIN seulement
router.post('/group-conversation', authMiddleware, restrictTo('TEACHER', 'ADMIN', 'INSTRUCTOR'), messageController.createGroupConversation);

module.exports = router;