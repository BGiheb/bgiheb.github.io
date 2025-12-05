// Service d'embedding pour vectoriser le texte
// Utilise un modèle simple basé sur TF-IDF ou une API externe

class EmbeddingService {
  constructor() {
    this.embeddingsCache = new Map();
  }

  /**
   * Génère un embedding simple basé sur TF-IDF pour un texte
   * Pour une vraie production, utiliser un modèle comme sentence-transformers
   */
  async generateEmbedding(text) {
    if (!text || text.trim().length === 0) {
      return null;
    }

    // Normaliser le texte
    const normalized = this.normalizeText(text);
    
    // Créer un embedding simple basé sur les mots
    // Dans une vraie application, utiliser un modèle comme sentence-transformers
    const words = this.tokenize(normalized);
    const embedding = this.createSimpleEmbedding(words);
    
    return embedding;
  }

  /**
   * Normalise le texte
   */
  normalizeText(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^\w\s]/g, ' '); // Remplacer la ponctuation par des espaces
  }

  /**
   * Tokenise le texte
   */
  tokenize(text) {
    return text
      .split(/\s+/)
      .filter(word => word.length > 2) // Filtrer les mots trop courts
      .filter(word => !this.isStopWord(word)); // Filtrer les mots vides
  }

  /**
   * Vérifie si un mot est un mot vide (stop word)
   */
  isStopWord(word) {
    const stopWords = new Set([
      'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou', 'mais',
      'pour', 'avec', 'sans', 'dans', 'sur', 'par', 'est', 'sont', 'être',
      'avoir', 'faire', 'aller', 'venir', 'voir', 'savoir', 'vouloir',
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
      'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could'
    ]);
    return stopWords.has(word);
  }

  /**
   * Crée un embedding simple basé sur la fréquence des mots
   * Dimension fixe de 128 pour simplifier
   */
  createSimpleEmbedding(words) {
    const dimension = 128;
    const embedding = new Array(dimension).fill(0);
    
    // Créer un hash simple pour chaque mot
    words.forEach((word, index) => {
      const hash = this.simpleHash(word);
      const position = hash % dimension;
      embedding[position] += 1 / (1 + index * 0.1); // Poids décroissant
    });
    
    // Normaliser le vecteur
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      return embedding.map(val => val / magnitude);
    }
    
    return embedding;
  }

  /**
   * Hash simple pour un mot
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir en entier 32 bits
    }
    return Math.abs(hash);
  }

  /**
   * Calcule la similarité cosinus entre deux embeddings
   */
  cosineSimilarity(embedding1, embedding2) {
    if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
      return 0;
    }

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      magnitude1 += embedding1[i] * embedding1[i];
      magnitude2 += embedding2[i] * embedding2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }
}

module.exports = new EmbeddingService();

