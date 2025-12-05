const express = require('express');
const router = express.Router();
const passwordController = require('../controllers/passwordController');
const authMiddleware = require('../middleware/authMiddleware');

// Route pour changer le mot de passe lors de la première connexion
router.post('/change', authMiddleware, passwordController.changePassword);

// Route pour vérifier si c'est la première connexion
router.get('/check-first-login', authMiddleware, passwordController.checkFirstLogin);

module.exports = router;