const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('../middleware/multer');
const { restrictTo, isTeacherOrStudentInClass } = require('../middleware/roleMiddleware');

// Upload a document : TEACHER, INSTRUCTOR, ADMIN seulement
router.post('/upload', authMiddleware, restrictTo('TEACHER', 'ADMIN', 'INSTRUCTOR'), multer.document.single('document'), documentController.uploadDocument);

// Get all documents for a class : Enseignant de la classe ou étudiant inscrit
router.get('/class/:classId', authMiddleware, isTeacherOrStudentInClass, documentController.getClassDocuments);

// Download a document : Enseignant de la classe ou étudiant inscrit
router.get('/download/:documentId', authMiddleware, documentController.downloadDocument);

// Delete a document : TEACHER, INSTRUCTOR, ADMIN seulement (et enseignant de la classe)
router.delete('/:documentId', authMiddleware, restrictTo('TEACHER', 'ADMIN', 'INSTRUCTOR'), documentController.deleteDocument);

module.exports = router;