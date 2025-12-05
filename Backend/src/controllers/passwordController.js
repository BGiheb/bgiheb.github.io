const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

// Contrôleur pour changer le mot de passe lors de la première connexion
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caractères" });
    }

    // Hachage du nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mise à jour du mot de passe et du statut de première connexion
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        firstLogin: false
      }
    });

    res.status(200).json({ message: "Mot de passe modifié avec succès" });
  } catch (error) {
    console.error("Erreur lors du changement de mot de passe:", error);
    res.status(500).json({ error: "Erreur serveur lors du changement de mot de passe" });
  }
};

// Vérifier si c'est la première connexion de l'utilisateur
exports.checkFirstLogin = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstLogin: true }
    });
    
    res.status(200).json({ firstLogin: user?.firstLogin || false });
  } catch (error) {
    console.error("Erreur lors de la vérification de première connexion:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};