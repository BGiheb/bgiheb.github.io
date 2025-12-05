const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Middleware pour vérifier si c'est la première connexion de l'utilisateur
exports.checkFirstLogin = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstLogin: true }
    });
    
    if (user && user.firstLogin) {
      // Si c'est la première connexion, on ajoute cette information à la requête
      req.isFirstLogin = true;
    } else {
      req.isFirstLogin = false;
    }
    
    next();
  } catch (error) {
    console.error("Erreur lors de la vérification de première connexion:", error);
    next();
  }
};