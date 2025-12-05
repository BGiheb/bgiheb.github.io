const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dxkqqwdlc',
  api_key: process.env.CLOUDINARY_API_KEY || '729116312571915',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Cn7WBuYvRjawFrRnqN2Jv-w3UKY',
});

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Récupéré via le middleware d'authentification
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { students: true, classes: true },
    });
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Erreur lors de la récupération du profil:", error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération du profil" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, email, phone, title, bio } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        email,
        phone,
        title,
        bio,
        updatedAt: new Date(),
      },
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil:", error);
    res.status(500).json({ error: "Erreur serveur lors de la mise à jour du profil" });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier téléchargé" });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: `avatars/${userId}`,
      resource_type: "image",
      public_id: `avatar_${Date.now()}`,
    });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar: result.secure_url, updatedAt: new Date() },
    });

    res.status(200).json({ avatar: result.secure_url, user: updatedUser });
  } catch (error) {
    console.error("Erreur lors de l'upload de l'avatar:", error);
    res.status(500).json({ error: "Erreur serveur lors de l'upload de l'avatar" });
  }
};

exports.deleteAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user.avatar) {
      return res.status(404).json({ error: "Aucun avatar à supprimer" });
    }

    // Extraire l'ID public de l'image Cloudinary à partir de l'URL
    const publicId = user.avatar.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(`avatars/${userId}/${publicId}`);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar: null, updatedAt: new Date() },
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Erreur lors de la suppression de l'avatar:", error);
    res.status(500).json({ error: "Erreur serveur lors de la suppression de l'avatar" });
  }
};