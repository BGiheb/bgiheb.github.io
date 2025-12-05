const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require("../middleware/authMiddleware");
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/me', authMiddleware, authController.getMe);
router.post('/reset-password', authMiddleware, authController.resetPassword);
router.get('/check-email', async (req, res) => {
  const { email } = req.query;
  const user = await prisma.user.findUnique({ where: { email } });
  res.json({ exists: !!user });
});

module.exports = router;