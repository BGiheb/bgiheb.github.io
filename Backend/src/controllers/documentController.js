const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');
const documentProcessor = require('../services/documentProcessor');
const embeddingService = require('../services/embeddingService');
const vectorStore = require('../services/vectorStore');

// Upload a document to a class
exports.uploadDocument = async (req, res) => {
  try {
    const { classId } = req.body;
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier n'a été téléchargé" });
    }
    
    if (!classId || isNaN(parseInt(classId))) {
      return res.status(400).json({ error: "ID de classe invalide" });
    }
    
    // Vérifier que l'utilisateur est bien l'enseignant de cette classe
    const classExists = await prisma.class.findFirst({
      where: { 
        id: parseInt(classId),
        teacherId: userId
      }
    });
    
    if (!classExists) {
      // Supprimer le fichier téléchargé si l'utilisateur n'est pas autorisé
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: "Vous n'êtes pas autorisé à télécharger des documents pour cette classe" });
    }
    
    // Créer l'entrée de document dans la base de données
    const document = await prisma.document.create({
      data: {
        classId: parseInt(classId),
        name: req.file.originalname,
        type: path.extname(req.file.originalname).substring(1), // Extraire l'extension sans le point
        size: `${(req.file.size / 1024).toFixed(2)} KB`,
        uploadedBy: userId,
      }
    });

    // Traiter le document en arrière-plan pour RAG
    // Utiliser un chemin absolu pour le fichier
    const absoluteFilePath = path.resolve(req.file.path);
    console.log(`Fichier uploadé: ${absoluteFilePath}, Type: ${document.type}`);
    processDocumentForRAG(document.id, absoluteFilePath, document.type, parseInt(classId))
      .catch(error => {
        console.error(`Erreur lors du traitement du document ${document.id} pour RAG:`, error);
      });
    
    res.status(201).json(document);
  } catch (error) {
    console.error("Erreur lors du téléchargement du document:", error);
    // Supprimer le fichier en cas d'erreur
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: "Erreur serveur lors du téléchargement du document" });
  }
};

// Get all documents for a class
exports.getClassDocuments = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user.id;
    
    if (!classId || isNaN(parseInt(classId))) {
      return res.status(400).json({ error: "ID de classe invalide" });
    }
    
    // Vérifier que l'utilisateur a accès à cette classe (enseignant ou étudiant)
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
      return res.status(403).json({ error: "Vous n'êtes pas autorisé à accéder aux documents de cette classe" });
    }
    
    // Récupérer les documents
    const documents = await prisma.document.findMany({
      where: { classId: parseInt(classId) },
      include: {
        uploader: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { uploadedAt: 'desc' }
    });
    
    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      name: doc.name,
      type: doc.type,
      size: doc.size,
      uploadedBy: `${doc.uploader.firstName} ${doc.uploader.lastName}`,
      uploadedAt: doc.uploadedAt,
      downloads: doc.downloads
    }));
    
    res.status(200).json(formattedDocuments);
  } catch (error) {
    console.error("Erreur lors de la récupération des documents:", error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des documents" });
  }
};

// Download a document
exports.downloadDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.id;
    
    if (!documentId || isNaN(parseInt(documentId))) {
      return res.status(400).json({ error: "ID de document invalide" });
    }
    
    // Récupérer le document
    const document = await prisma.document.findUnique({
      where: { id: parseInt(documentId) },
      include: { class: true }
    });
    
    if (!document) {
      return res.status(404).json({ error: "Document introuvable" });
    }
    
    // Vérifier que l'utilisateur a accès à ce document
    const isTeacher = document.class.teacherId === userId;
    
    const student = await prisma.student.findFirst({
      where: { userId }
    });
    
    const isStudent = student && await prisma.classStudent.findFirst({
      where: {
        classId: document.classId,
        studentId: student.id
      }
    });
    
    if (!isTeacher && !isStudent) {
      return res.status(403).json({ error: "Vous n'êtes pas autorisé à télécharger ce document" });
    }
    
    // Incrémenter le compteur de téléchargements
    await prisma.document.update({
      where: { id: parseInt(documentId) },
      data: { downloads: { increment: 1 } }
    });
    
    // Chemin du fichier
    const filePath = path.join(__dirname, '../../uploads', document.name);
    
    // Vérifier si le fichier existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Fichier introuvable sur le serveur" });
    }
    
    // Envoyer le fichier
    res.download(filePath, document.name);
  } catch (error) {
    console.error("Erreur lors du téléchargement du document:", error);
    res.status(500).json({ error: "Erreur serveur lors du téléchargement du document" });
  }
};

// Delete a document
exports.deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.id;
    
    if (!documentId || isNaN(parseInt(documentId))) {
      return res.status(400).json({ error: "ID de document invalide" });
    }
    
    // Récupérer le document
    const document = await prisma.document.findUnique({
      where: { id: parseInt(documentId) },
      include: { class: true }
    });
    
    if (!document) {
      return res.status(404).json({ error: "Document introuvable" });
    }
    
    // Vérifier que l'utilisateur est l'enseignant de la classe ou l'uploader du document
    if (document.class.teacherId !== userId && document.uploadedBy !== userId) {
      return res.status(403).json({ error: "Vous n'êtes pas autorisé à supprimer ce document" });
    }
    
    // Supprimer le fichier
    const filePath = path.join(__dirname, '../../uploads', document.name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Supprimer l'entrée de la base de données
    await prisma.document.delete({
      where: { id: parseInt(documentId) }
    });
    
    // Supprimer aussi de la base vectorielle
    vectorStore.removeDocument(parseInt(classId), parseInt(documentId));

    res.status(200).json({ message: "Document supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du document:", error);
    res.status(500).json({ error: "Erreur serveur lors de la suppression du document" });
  }
};

/**
 * Traite un document pour RAG (extraction, chunking, embedding)
 */
async function processDocumentForRAG(documentId, filePath, fileType, classId) {
  try {
    console.log(`[RAG] Début du traitement du document ${documentId} (${fileType}) pour la classe ${classId}`);
    console.log(`[RAG] Chemin du fichier: ${filePath}`);
    
    // Vérifier que le fichier existe
    if (!fs.existsSync(filePath)) {
      console.error(`[RAG] Le fichier n'existe pas: ${filePath}`);
      return;
    }
    
    // 1. Extraire le texte
    console.log(`[RAG] Extraction du texte...`);
    const text = await documentProcessor.extractText(filePath, fileType);
    console.log(`[RAG] Texte extrait: ${text ? text.length : 0} caractères`);
    
    if (!text || text.trim().length === 0) {
      console.warn(`[RAG] Aucun texte extrait du document ${documentId} (type: ${fileType})`);
      console.warn(`[RAG] Pour les PDF/DOCX, installez: npm install pdf-parse mammoth`);
      return;
    }

    // 2. Nettoyer le texte
    const cleanedText = documentProcessor.cleanText(text);
    console.log(`[RAG] Texte nettoyé: ${cleanedText.length} caractères`);
    
    // 3. Diviser en chunks
    console.log(`[RAG] Création des chunks...`);
    const chunks = documentProcessor.chunkText(cleanedText, 1000, 200);
    console.log(`[RAG] ${chunks.length} chunks créés`);
    
    if (chunks.length === 0) {
      console.warn(`[RAG] Aucun chunk créé pour le document ${documentId}`);
      return;
    }

    // 4. Générer les embeddings pour chaque chunk
    console.log(`[RAG] Génération des embeddings...`);
    const chunksWithEmbeddings = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await embeddingService.generateEmbedding(chunk.text);
      
      if (embedding) {
        chunksWithEmbeddings.push({
          id: `${documentId}_${i}`,
          text: chunk.text,
          embedding: embedding,
          metadata: {
            documentId: documentId,
            chunkIndex: i,
            start: chunk.start,
            end: chunk.end
          }
        });
      }
      
      // Log tous les 10 chunks
      if ((i + 1) % 10 === 0) {
        console.log(`[RAG] ${i + 1}/${chunks.length} chunks traités...`);
      }
    }

    console.log(`[RAG] ${chunksWithEmbeddings.length} embeddings générés`);

    // 5. Ajouter à la base vectorielle
    if (chunksWithEmbeddings.length > 0) {
      vectorStore.addDocument(classId, documentId, chunksWithEmbeddings);
      console.log(`[RAG] ✅ Document ${documentId} traité avec succès: ${chunksWithEmbeddings.length} chunks ajoutés à la base vectorielle de la classe ${classId}`);
      
      // Vérifier que les embeddings sont bien sauvegardés
      const savedEmbeddings = vectorStore.loadClassEmbeddings(classId);
      console.log(`[RAG] Total d'embeddings dans la base pour la classe ${classId}: ${savedEmbeddings.length}`);
    } else {
      console.warn(`[RAG] ⚠️ Aucun embedding généré pour le document ${documentId}`);
    }
  } catch (error) {
    console.error(`[RAG] ❌ Erreur lors du traitement du document ${documentId} pour RAG:`, error);
    console.error(`[RAG] Stack trace:`, error.stack);
  }
}