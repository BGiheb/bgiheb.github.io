const fs = require('fs');
const path = require('path');

// Service de traitement de documents pour extraire le texte
class DocumentProcessor {
  /**
   * Extrait le texte d'un document selon son type
   */
  async extractText(filePath, fileType) {
    try {
      const normalizedType = fileType.toLowerCase();
      console.log(`[DocumentProcessor] Extraction du texte pour type: ${normalizedType}`);
      
      switch (normalizedType) {
        case 'pdf':
          return await this.extractFromPDF(filePath);
        case 'docx':
        case 'doc':
          return await this.extractFromDOCX(filePath);
        case 'txt':
        case 'md':
        case 'markdown':
          return await this.extractFromTXT(filePath);
        default:
          console.warn(`[DocumentProcessor] Type de fichier non supporté: ${fileType}, tentative avec TXT...`);
          // Essayer de lire comme fichier texte pour les types non reconnus
          return await this.extractFromTXT(filePath);
      }
    } catch (error) {
      console.error(`[DocumentProcessor] Erreur lors de l'extraction du texte: ${error.message}`);
      console.error(`[DocumentProcessor] Stack: ${error.stack}`);
      return '';
    }
  }

  /**
   * Extrait le texte d'un fichier PDF
   */
  async extractFromPDF(filePath) {
    try {
      // Utiliser pdf-parse si disponible, sinon retourner un message
      const pdfParse = require('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      console.error('Erreur PDF:', error.message);
      // Si pdf-parse n'est pas installé, retourner un message d'erreur
      if (error.code === 'MODULE_NOT_FOUND') {
        console.warn('pdf-parse n\'est pas installé. Installation recommandée: npm install pdf-parse');
        return '';
      }
      throw error;
    }
  }

  /**
   * Extrait le texte d'un fichier DOCX
   */
  async extractFromDOCX(filePath) {
    try {
      // Utiliser mammoth si disponible
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      console.error('Erreur DOCX:', error.message);
      if (error.code === 'MODULE_NOT_FOUND') {
        console.warn('mammoth n\'est pas installé. Installation recommandée: npm install mammoth');
        return '';
      }
      throw error;
    }
  }

  /**
   * Extrait le texte d'un fichier texte
   */
  async extractFromTXT(filePath) {
    try {
      const fs = require('fs');
      const text = fs.readFileSync(filePath, 'utf-8');
      console.log(`[DocumentProcessor] Fichier TXT lu: ${text.length} caractères`);
      return text;
    } catch (error) {
      console.error('[DocumentProcessor] Erreur TXT:', error.message);
      return '';
    }
  }

  /**
   * Divise le texte en chunks pour l'embedding
   */
  chunkText(text, chunkSize = 1000, overlap = 200) {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const chunks = [];
    let start = 0;
    
    while (start < text.length) {
      let end = start + chunkSize;
      
      // Essayer de couper à la fin d'une phrase
      if (end < text.length) {
        const lastPeriod = text.lastIndexOf('.', end);
        const lastNewline = text.lastIndexOf('\n', end);
        const cutPoint = Math.max(lastPeriod, lastNewline);
        
        if (cutPoint > start + chunkSize * 0.5) {
          end = cutPoint + 1;
        }
      }
      
      const chunk = text.substring(start, end).trim();
      if (chunk.length > 0) {
        chunks.push({
          text: chunk,
          start: start,
          end: end
        });
      }
      
      start = end - overlap;
    }
    
    return chunks;
  }

  /**
   * Nettoie le texte extrait
   */
  cleanText(text) {
    if (!text) return '';
    
    // Supprimer les espaces multiples
    text = text.replace(/\s+/g, ' ');
    
    // Supprimer les caractères de contrôle
    text = text.replace(/[\x00-\x1F\x7F]/g, '');
    
    // Normaliser les sauts de ligne
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    return text.trim();
  }
}

module.exports = new DocumentProcessor();

