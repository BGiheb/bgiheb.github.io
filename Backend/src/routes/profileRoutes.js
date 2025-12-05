const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authMiddleware = require("../middleware/authMiddleware");
const upload = require('../middleware/multer'); // Assurez-vous d'avoir un middleware Multer configuré

// Récupérer le profil
router.get('/', authMiddleware, profileController.getProfile);

// Mettre à jour le profil
router.put('/', authMiddleware, profileController.updateProfile);

// Télécharger un avatar
router.post('/avatar', authMiddleware, upload.single('avatar'), profileController.uploadAvatar);

// Supprimer l'avatar
router.delete('/avatar', authMiddleware, profileController.deleteAvatar);

module.exports = router;