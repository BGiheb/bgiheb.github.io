const fs = require('fs');
const path = require('path');

// Système de stockage vectoriel simple basé sur fichiers JSON
class VectorStore {
  constructor() {
    this.storagePath = path.join(__dirname, '../../vector_store');
    this.ensureStorageDirectory();
  }

  /**
   * Crée le répertoire de stockage s'il n'existe pas
   */
  ensureStorageDirectory() {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  /**
   * Obtient le chemin du fichier pour une classe
   */
  getClassFilePath(classId) {
    return path.join(this.storagePath, `class_${classId}.json`);
  }

  /**
   * Charge les embeddings d'une classe
   */
  loadClassEmbeddings(classId) {
    const filePath = this.getClassFilePath(classId);
    
    if (!fs.existsSync(filePath)) {
      return [];
    }

    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Erreur lors du chargement des embeddings pour la classe ${classId}:`, error);
      return [];
    }
  }

  /**
   * Sauvegarde les embeddings d'une classe
   */
  saveClassEmbeddings(classId, embeddings) {
    const filePath = this.getClassFilePath(classId);
    
    try {
      fs.writeFileSync(filePath, JSON.stringify(embeddings, null, 2), 'utf-8');
      return true;
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde des embeddings pour la classe ${classId}:`, error);
      return false;
    }
  }

  /**
   * Ajoute un nouveau document à la base vectorielle
   */
  addDocument(classId, documentId, chunks) {
    const embeddings = this.loadClassEmbeddings(classId);
    
    console.log(`[VectorStore] Ajout de ${chunks.length} chunks pour le document ${documentId} à la classe ${classId}`);
    
    // Supprimer les anciens chunks de ce document s'ils existent
    const filtered = embeddings.filter(emb => emb.documentId !== documentId);
    
    // Ajouter les nouveaux chunks
    chunks.forEach(chunk => {
      filtered.push({
        documentId: parseInt(documentId),
        chunkId: chunk.id,
        text: chunk.text,
        embedding: chunk.embedding,
        metadata: chunk.metadata || {}
      });
    });

    const saved = this.saveClassEmbeddings(classId, filtered);
    if (saved) {
      console.log(`[VectorStore] ✅ ${filtered.length} embeddings sauvegardés pour la classe ${classId}`);
    } else {
      console.error(`[VectorStore] ❌ Erreur lors de la sauvegarde des embeddings pour la classe ${classId}`);
    }
  }

  /**
   * Supprime un document de la base vectorielle
   */
  removeDocument(classId, documentId) {
    const embeddings = this.loadClassEmbeddings(classId);
    const filtered = embeddings.filter(emb => emb.documentId !== documentId);
    this.saveClassEmbeddings(classId, filtered);
  }

  /**
   * Recherche les chunks les plus pertinents pour une requête
   */
  search(classId, queryEmbedding, topK = 5) {
    const embeddings = this.loadClassEmbeddings(classId);
    
    console.log(`[VectorStore] Recherche dans ${embeddings.length} embeddings pour la classe ${classId}`);
    
    if (embeddings.length === 0) {
      console.warn(`[VectorStore] Aucun embedding trouvé pour la classe ${classId}`);
      return [];
    }

    // Calculer la similarité pour chaque chunk
    const results = embeddings.map(emb => {
      const similarity = this.cosineSimilarity(queryEmbedding, emb.embedding);
      return {
        ...emb,
        similarity: similarity
      };
    });

    // Trier par similarité décroissante
    results.sort((a, b) => b.similarity - a.similarity);

    // Retourner les top K résultats - prendre au moins les 3 meilleurs même avec faible similarité
    const topResults = results.slice(0, topK);
    
    // Si on a des résultats avec similarité > 0.01, les prendre
    // Sinon, prendre au moins les 3 meilleurs
    const filtered = topResults.filter(result => result.similarity > 0.01);
    const finalResults = filtered.length >= 3 ? filtered : topResults.slice(0, Math.max(3, filtered.length));
    
    console.log(`[VectorStore] ${finalResults.length} résultats retournés`);
    if (finalResults.length > 0) {
      console.log(`[VectorStore] Meilleure similarité: ${finalResults[0].similarity.toFixed(3)}`);
      console.log(`[VectorStore] Pire similarité: ${finalResults[finalResults.length - 1].similarity.toFixed(3)}`);
    }
    
    return finalResults;
  }

  /**
   * Calcule la similarité cosinus
   */
  cosineSimilarity(vec1, vec2) {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) {
      return 0;
    }

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      magnitude1 += vec1[i] * vec1[i];
      magnitude2 += vec2[i] * vec2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }
}

module.exports = new VectorStore();

