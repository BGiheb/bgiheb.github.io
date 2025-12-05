const { PrismaClient } = require('@prisma/client');
const vagrantService = require('../services/vagrantService');
const path = require('path');

const prisma = new PrismaClient();

/**
 * Récupère tous les labs d'un instructeur
 */
const getMyLabs = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Seuls les instructeurs peuvent voir leurs labs
    if (userRole !== 'INSTRUCTOR' && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé. Seuls les instructeurs peuvent accéder aux labs.' });
    }

    const labs = await prisma.lab.findMany({
      where: {
        instructorId: userId,
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        class: {
          select: {
            id: true,
            title: true,
            code: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(labs);
  } catch (error) {
    console.error('Erreur lors de la récupération des labs:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des labs' });
  }
};

/**
 * Crée un nouveau lab
 */
const createLab = async (req, res) => {
  try {
    const { title, description, vagrantBox, vagrantConfig, classId } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Vérifier les permissions
    if (userRole !== 'INSTRUCTOR' && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Seuls les instructeurs peuvent créer des labs.' });
    }

    if (!title || !vagrantBox) {
      return res.status(400).json({ error: 'Le titre et la box Vagrant sont requis' });
    }

    // Créer le lab dans la base de données
    const lab = await prisma.lab.create({
      data: {
        title,
        description: description || null,
        vagrantBox,
        vagrantConfig: vagrantConfig ? JSON.stringify(vagrantConfig) : null,
        instructorId: userId,
        classId: classId ? parseInt(classId) : null,
        status: 'CREATED',
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        class: {
          select: {
            id: true,
            title: true,
            code: true,
          },
        },
      },
    });

    res.status(201).json(lab);
  } catch (error) {
    console.error('Erreur lors de la création du lab:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la création du lab' });
  }
};

/**
 * Lance une VM pour un lab
 */
const launchLab = async (req, res) => {
  try {
    const { labId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Vérifier les permissions
    if (userRole !== 'INSTRUCTOR' && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Seuls les instructeurs peuvent lancer des labs.' });
    }

    // Récupérer le lab
    const lab = await prisma.lab.findUnique({
      where: { id: parseInt(labId) },
    });

    if (!lab) {
      return res.status(404).json({ error: 'Lab non trouvé' });
    }

    // Vérifier que l'instructeur est le propriétaire
    if (lab.instructorId !== userId && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Vous n\'avez pas la permission de lancer ce lab.' });
    }

    // Mettre à jour le statut à RUNNING
    await prisma.lab.update({
      where: { id: parseInt(labId) },
      data: { status: 'RUNNING' },
    });

    // Lancer la VM de manière asynchrone
    const vagrantConfig = lab.vagrantConfig ? JSON.parse(lab.vagrantConfig) : {
      box: lab.vagrantBox,
      memory: '1024',
      cpus: 1,
    };
    
    vagrantService.createAndStartVM(labId, vagrantConfig)
      .then(async (vmPath) => {
        // Mettre à jour le lab avec le chemin de la VM
        await prisma.lab.update({
          where: { id: parseInt(labId) },
          data: {
            vmPath,
            status: 'RUNNING',
          },
        });
        console.log(`[Lab] Lab ${labId} lancé avec succès: ${vmPath}`);
      })
      .catch(async (error) => {
        console.error(`[Lab] Erreur lors du lancement du lab ${labId}:`, error);
        // Mettre à jour le statut à ERROR
        await prisma.lab.update({
          where: { id: parseInt(labId) },
          data: { status: 'ERROR' },
        });
      });

    // Répondre immédiatement
    res.json({
      message: 'Lancement du lab en cours...',
      labId: parseInt(labId),
    });
  } catch (error) {
    console.error('Erreur lors du lancement du lab:', error);
    res.status(500).json({ error: 'Erreur serveur lors du lancement du lab' });
  }
};

/**
 * Arrête un lab
 */
const stopLab = async (req, res) => {
  try {
    const { labId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Vérifier les permissions
    if (userRole !== 'INSTRUCTOR' && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Seuls les instructeurs peuvent arrêter des labs.' });
    }

    const lab = await prisma.lab.findUnique({
      where: { id: parseInt(labId) },
    });

    if (!lab) {
      return res.status(404).json({ error: 'Lab non trouvé' });
    }

    if (lab.instructorId !== userId && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Vous n\'avez pas la permission d\'arrêter ce lab.' });
    }

    if (!lab.vmPath) {
      return res.status(400).json({ error: 'Aucune VM associée à ce lab' });
    }

    // Arrêter la VM
    await vagrantService.stopVM(lab.vmPath);

    // Mettre à jour le statut
    await prisma.lab.update({
      where: { id: parseInt(labId) },
      data: { status: 'STOPPED' },
    });

    res.json({ message: 'Lab arrêté avec succès' });
  } catch (error) {
    console.error('Erreur lors de l\'arrêt du lab:', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'arrêt du lab' });
  }
};

/**
 * Supprime un lab
 */
const deleteLab = async (req, res) => {
  try {
    const { labId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Vérifier les permissions
    if (userRole !== 'INSTRUCTOR' && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Seuls les instructeurs peuvent supprimer des labs.' });
    }

    const lab = await prisma.lab.findUnique({
      where: { id: parseInt(labId) },
    });

    if (!lab) {
      return res.status(404).json({ error: 'Lab non trouvé' });
    }

    if (lab.instructorId !== userId && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Vous n\'avez pas la permission de supprimer ce lab.' });
    }

    // Supprimer la VM si elle existe
    if (lab.vmPath) {
      try {
        await vagrantService.destroyVM(lab.vmPath);
      } catch (error) {
        console.error('Erreur lors de la suppression de la VM:', error);
        // Continuer même si la suppression de la VM échoue
      }
    }

    // Supprimer le lab de la base de données
    await prisma.lab.delete({
      where: { id: parseInt(labId) },
    });

    res.json({ message: 'Lab supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du lab:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression du lab' });
  }
};

/**
 * Récupère le statut d'un lab
 */
const getLabStatus = async (req, res) => {
  try {
    const { labId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'INSTRUCTOR' && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const lab = await prisma.lab.findUnique({
      where: { id: parseInt(labId) },
    });

    if (!lab) {
      return res.status(404).json({ error: 'Lab non trouvé' });
    }

    if (lab.instructorId !== userId && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Vérifier le statut réel de la VM si elle existe
    let vmStatus = lab.status;
    if (lab.vmPath) {
      try {
        const actualStatus = await vagrantService.getVMStatus(lab.vmPath);
        if (actualStatus !== lab.status) {
          // Mettre à jour le statut dans la base de données
          await prisma.lab.update({
            where: { id: parseInt(labId) },
            data: { status: actualStatus },
          });
          vmStatus = actualStatus;
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du statut:', error);
      }
    }

    res.json({
      id: lab.id,
      status: vmStatus,
      vmPath: lab.vmPath,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du statut:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  getMyLabs,
  createLab,
  launchLab,
  stopLab,
  deleteLab,
  getLabStatus,
};

