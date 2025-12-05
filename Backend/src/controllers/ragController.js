const ragService = require('../services/ragService');
const vectorStore = require('../services/vectorStore');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Génère une réponse RAG pour une question dans une classe
 */
exports.generateRAGResponse = async (req, res) => {
  try {
    const { classId } = req.params;
    const { question } = req.body;
    const userId = req.user.id;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({ error: 'La question est requise' });
    }

    if (!classId || isNaN(parseInt(classId))) {
      return res.status(400).json({ error: 'ID de classe invalide' });
    }

    // Vérifier que l'utilisateur a accès à cette classe
    const isTeacher = await prisma.class.findFirst({
      where: { 
        id: parseInt(classId),
        teacherId: userId
      }
    });

    const student = await prisma.student.findFirst({
      where: { userId }
    });

    const isStudent = student && await prisma.classStudent.findFirst({
      where: {
        classId: parseInt(classId),
        studentId: student.id
      }
    });

    if (!isTeacher && !isStudent) {
      return res.status(403).json({ error: "Vous n'avez pas accès à cette classe" });
    }

    // Générer la réponse RAG
    const result = await ragService.generateResponse(parseInt(classId), question);

    res.status(200).json(result);
  } catch (error) {
    console.error('Erreur lors de la génération de la réponse RAG:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la génération de la réponse' });
  }
};

/**
 * Endpoint de diagnostic pour vérifier l'état du RAG
 */
exports.checkRAGStatus = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user.id;

    if (!classId || isNaN(parseInt(classId))) {
      return res.status(400).json({ error: 'ID de classe invalide' });
    }

    // Vérifier l'accès
    const isTeacher = await prisma.class.findFirst({
      where: { id: parseInt(classId), teacherId: userId }
    });
    const student = await prisma.student.findFirst({ where: { userId } });
    const isStudent = student && await prisma.classStudent.findFirst({
      where: { classId: parseInt(classId), studentId: student.id }
    });

    if (!isTeacher && !isStudent) {
      return res.status(403).json({ error: "Vous n'avez pas accès à cette classe" });
    }

    // Récupérer les documents de la classe
    const documents = await prisma.document.findMany({
      where: { classId: parseInt(classId) },
      select: { id: true, name: true, type: true, uploadedAt: true }
    });

    // Vérifier les embeddings
    const embeddings = vectorStore.loadClassEmbeddings(parseInt(classId));
    
    // Tester la connexion LM Studio
    const lmStudioStatus = await ragService.testLMStudioConnection();

    res.status(200).json({
      classId: parseInt(classId),
      documents: {
        total: documents.length,
        list: documents
      },
      embeddings: {
        total: embeddings.length,
        documentsWithEmbeddings: [...new Set(embeddings.map(e => e.documentId))].length
      },
      lmStudio: lmStudioStatus,
      status: embeddings.length > 0 ? 'ready' : 'no_embeddings'
    });
  } catch (error) {
    console.error('Erreur lors de la vérification du statut RAG:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
