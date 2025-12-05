const embeddingService = require('./embeddingService');
const vectorStore = require('./vectorStore');
const axios = require('axios');

// Service RAG pour générer des réponses basées sur les documents
class RAGService {
  constructor() {
    // URL de LM Studio (par défaut localhost:1234)
    this.lmStudioUrl = process.env.LM_STUDIO_URL || 'http://localhost:1234';
  }

  /**
   * Génère une réponse RAG pour une question
   */
  async generateResponse(classId, question) {
    try {
      console.log(`[RAG] Question reçue pour la classe ${classId}: "${question}"`);
      
      // Vérifier d'abord si des embeddings existent pour cette classe
      const allEmbeddings = vectorStore.loadClassEmbeddings(classId);
      console.log(`[RAG] Nombre total d'embeddings pour la classe ${classId}: ${allEmbeddings.length}`);
      
      if (allEmbeddings.length === 0) {
        console.warn(`[RAG] Aucun embedding trouvé pour la classe ${classId}`);
        return {
          answer: "Aucun document n'a encore été traité pour cette classe. Veuillez uploader des documents (PDF, DOCX, TXT, MD) et attendez quelques instants qu'ils soient traités.",
          sources: []
        };
      }
      
      // 1. Générer l'embedding de la question
      console.log(`[RAG] Génération de l'embedding de la question...`);
      const questionEmbedding = await embeddingService.generateEmbedding(question);
      
      if (!questionEmbedding) {
        console.error(`[RAG] Impossible de générer l'embedding de la question`);
        return {
          answer: "Je n'ai pas pu traiter votre question. Pouvez-vous la reformuler ?",
          sources: []
        };
      }

      // 2. Rechercher les chunks pertinents dans la base vectorielle
      console.log(`[RAG] Recherche des chunks pertinents...`);
      // Augmenter le nombre de résultats recherchés pour avoir plus de contexte
      const relevantChunks = vectorStore.search(classId, questionEmbedding, 10);
      console.log(`[RAG] ${relevantChunks.length} chunks pertinents trouvés (sur ${allEmbeddings.length} disponibles)`);
      
      // Toujours utiliser au moins quelques chunks même avec faible similarité
      let chunksToUse = relevantChunks;
      if (relevantChunks.length === 0 && allEmbeddings.length > 0) {
        console.log(`[RAG] Aucun chunk avec similarité suffisante, utilisation des meilleurs chunks disponibles`);
        // Prendre les 5 premiers embeddings même sans similarité élevée
        chunksToUse = allEmbeddings.slice(0, 5).map(emb => ({
          ...emb,
          similarity: 0.05 // Similarité minimale pour indiquer que c'est un fallback
        }));
        console.log(`[RAG] Utilisation de ${chunksToUse.length} chunks en mode fallback`);
      }
      
      if (chunksToUse.length === 0) {
        return {
          answer: "Aucun document n'a encore été traité pour cette classe. Veuillez uploader des documents (PDF, DOCX, TXT, MD) et attendez quelques instants qu'ils soient traités.",
          sources: []
        };
      }
      
      console.log(`[RAG] Similarités trouvées: ${chunksToUse.map(c => c.similarity.toFixed(3)).join(', ')}`);
      
      // Afficher un aperçu des chunks trouvés
      chunksToUse.forEach((chunk, idx) => {
        console.log(`[RAG] Chunk ${idx + 1} (similarité: ${chunk.similarity.toFixed(3)}): ${chunk.text.substring(0, 100)}...`);
      });

      // 3. Construire le contexte à partir des chunks pertinents
      const context = this.buildContext(chunksToUse);
      console.log(`[RAG] Contexte construit: ${context.length} caractères`);
      console.log(`[RAG] Aperçu du contexte: ${context.substring(0, 200)}...`);
      
      // 4. Générer la réponse avec LM Studio
      console.log(`[RAG] Génération de la réponse avec LM Studio...`);
      const answer = await this.generateWithLMStudio(question, context);
      console.log(`[RAG] Réponse générée: ${answer.length} caractères`);
      
      // 5. Préparer les sources
      const sources = chunksToUse.map(chunk => ({
        documentId: chunk.documentId,
        text: chunk.text.substring(0, 200) + '...', // Extrait pour l'affichage
        similarity: chunk.similarity
      }));

      return {
        answer,
        sources
      };
    } catch (error) {
      console.error('Erreur dans generateResponse:', error);
      return {
        answer: "Désolé, une erreur est survenue lors de la génération de la réponse. Veuillez réessayer.",
        sources: []
      };
    }
  }

  /**
   * Construit le contexte à partir des chunks pertinents
   */
  buildContext(chunks) {
    return chunks
      .map((chunk, index) => `[Document ${index + 1}]\n${chunk.text}`)
      .join('\n\n');
  }

  /**
   * Génère une réponse avec LM Studio
   */
  async generateWithLMStudio(question, context) {
    try {
      const prompt = this.buildPrompt(question, context);
      
      console.log(`[RAG] Envoi à LM Studio (${this.lmStudioUrl})...`);
      console.log(`[RAG] Contexte (${context.length} caractères) sera inclus dans la requête`);
      
      const response = await axios.post(`${this.lmStudioUrl}/v1/chat/completions`, {
        model: "local-model", // LM Studio utilise ce nom par défaut
        messages: [
          {
            role: "system",
            content: "Tu es un assistant IA éducatif. Tu réponds aux questions des étudiants en te basant UNIQUEMENT sur les informations fournies dans le contexte ci-dessous. Utilise ces informations pour donner une réponse précise et détaillée. Si l'information n'est pas dans le contexte, dis-le clairement."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      }, {
        timeout: 60000 // 60 secondes de timeout
      });

      console.log(`[RAG] Réponse reçue de LM Studio`);

      if (response.data && response.data.choices && response.data.choices.length > 0) {
        let answer = response.data.choices[0].message.content.trim();
        
        // Nettoyer la réponse : supprimer les balises <think>
        answer = this.cleanAnswer(answer);
        
        console.log(`[RAG] Réponse générée (${answer.length} caractères)`);
        return answer;
      }

      throw new Error('Réponse invalide de LM Studio');
    } catch (error) {
      console.error('[RAG] Erreur LM Studio:', error.message);
      if (error.code === 'ECONNREFUSED') {
        console.error('[RAG] LM Studio n\'est pas accessible. Assurez-vous qu\'il est démarré sur', this.lmStudioUrl);
      }
      
      // Fallback: générer une réponse simple basée sur le contexte
      if (context) {
        console.log('[RAG] Utilisation du fallback avec le contexte disponible');
        return this.generateFallbackResponse(question, context);
      }
      
      throw error;
    }
  }

  /**
   * Teste la connexion à LM Studio
   */
  async testLMStudioConnection() {
    try {
      const response = await axios.get(`${this.lmStudioUrl}/v1/models`, {
        timeout: 5000
      });
      return {
        connected: true,
        url: this.lmStudioUrl,
        models: response.data?.data || []
      };
    } catch (error) {
      return {
        connected: false,
        url: this.lmStudioUrl,
        error: error.message
      };
    }
  }

  /**
   * Construit le prompt pour LM Studio
   */
  buildPrompt(question, context) {
    return `CONTEXTE (extrait des documents de la classe):
${context}

QUESTION: ${question}

INSTRUCTIONS IMPORTANTES:
1. Réponds UNIQUEMENT en utilisant les informations du CONTEXTE ci-dessus
2. Sois précis et détaillé dans ta réponse
3. Cite les informations du contexte de manière claire
4. Si l'information n'est pas dans le contexte, dis: "Cette information n'est pas disponible dans les documents de la classe"
5. Utilise un langage clair et pédagogique

RÉPONSE:`;
  }

  /**
   * Nettoie la réponse en supprimant les balises de raisonnement
   */
  cleanAnswer(answer) {
    let cleaned = answer;
    
    // Supprimer les balises de raisonnement (format DeepSeek-R1)
    // Patterns pour capturer toutes les variantes possibles de balises de raisonnement
    // Utilise des patterns flexibles pour gérer les variations de caractères
    
    // Pattern général pour capturer toute balise XML/HTML qui pourrait être du raisonnement
    // Cherche les balises qui commencent par < et se terminent par >
    const reasoningPatterns = [
      // Format <think>...</think> (toutes variantes possibles)
      /<think[^>]*>[\s\S]*?<\/think[^>]*>/gi,
      // Format <think>...</think> (toutes variantes possibles)
      /<think[^>]*>[\s\S]*?<\/think[^>]*>/gi,
      // Format <think>...</think>
      /<redacted_reasoning[^>]*>[\s\S]*?<\/redacted_reasoning[^>]*>/gi,
      // Format mixte <think>...</think>
      /<think[^>]*>[\s\S]*?<\/redacted_reasoning[^>]*>/gi,
      // Format mixte inverse <think>...</think>
      /<think[^>]*>[\s\S]*?<\/think[^>]*>/gi,
      // Pattern très général pour capturer toute balise qui contient "think" ou "reasoning"
      /<[^>]*(?:think|reasoning|reason)[^>]*>[\s\S]*?<\/[^>]*(?:think|reasoning|reason)[^>]*>/gi,
    ];
    
    // Appliquer tous les patterns plusieurs fois pour s'assurer de tout capturer
    for (let i = 0; i < 3; i++) {
      reasoningPatterns.forEach(pattern => {
        cleaned = cleaned.replace(pattern, '');
      });
    }
    
    // Supprimer les balises orphelines restantes (ouvrantes et fermantes séparées)
    const orphanTags = [
      /<think[^>]*>/gi,
      /<\/think[^>]*>/gi,
      /<think[^>]*>/gi,
      /<\/think[^>]*>/gi,
      /<redacted_reasoning[^>]*>/gi,
      /<\/redacted_reasoning[^>]*>/gi,
      /<[^>]*(?:think|reasoning|reason)[^>]*>/gi,
      /<\/[^>]*(?:think|reasoning|reason)[^>]*>/gi,
    ];
    
    orphanTags.forEach(tag => {
      cleaned = cleaned.replace(tag, '');
    });
    
    // Supprimer les balises XML/HTML restantes qui pourraient être du raisonnement
    cleaned = cleaned.replace(/<reasoning[^>]*>[\s\S]*?<\/reasoning[^>]*>/gi, '');
    cleaned = cleaned.replace(/<reason[^>]*>[\s\S]*?<\/reason[^>]*>/gi, '');
    
    // Nettoyer les espaces multiples et sauts de ligne
    cleaned = cleaned.replace(/\n\s*\n\s*\n+/g, '\n\n');
    cleaned = cleaned.replace(/^\s+|\s+$/gm, ''); // Supprimer les espaces en début/fin de ligne
    cleaned = cleaned.trim();
    
    return cleaned;
  }

  /**
   * Génère une réponse de fallback si LM Studio n'est pas disponible
   */
  generateFallbackResponse(question, context) {
    console.log('[RAG] Génération de réponse fallback (LM Studio non disponible)');
    
    // Recherche simple de mots-clés dans le contexte
    const questionWords = question.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['dans', 'pour', 'avec', 'sont', 'cette', 'classe', 'document'].includes(word));
    
    console.log(`[RAG] Mots-clés de la question: ${questionWords.join(', ')}`);
    
    // Diviser le contexte en chunks plus petits
    const contextChunks = context.split(/\n\n/);
    
    // Trouver les chunks les plus pertinents
    const relevantChunks = contextChunks
      .map(chunk => {
        const chunkLower = chunk.toLowerCase();
        const score = questionWords.reduce((score, word) => {
          return score + (chunkLower.includes(word) ? 1 : 0);
        }, 0);
        return { chunk, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (relevantChunks.length > 0) {
      const answer = `Basé sur les documents de la classe, voici ce que je peux vous dire:\n\n${relevantChunks.map(c => c.chunk.substring(0, 500)).join('\n\n...\n\n')}`;
      console.log(`[RAG] Réponse fallback générée (${answer.length} caractères)`);
      return answer;
    }

    // Si aucun chunk pertinent, retourner les premiers chunks du contexte
    if (contextChunks.length > 0) {
      const answer = `Voici des informations des documents de la classe qui pourraient être pertinentes:\n\n${contextChunks.slice(0, 2).join('\n\n...\n\n').substring(0, 1000)}`;
      console.log(`[RAG] Réponse fallback avec premiers chunks (${answer.length} caractères)`);
      return answer;
    }

    return "Je n'ai pas trouvé d'informations spécifiques pour répondre à votre question dans les documents disponibles. Pouvez-vous reformuler votre question ?";
  }
}

module.exports = new RAGService();

