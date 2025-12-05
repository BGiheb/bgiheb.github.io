# Configuration du système RAG

## Vue d'ensemble

Le système RAG (Retrieval-Augmented Generation) permet à l'assistant IA de chaque classe de répondre aux questions en se basant sur les documents uploadés dans la classe.

## Fonctionnalités

1. **Extraction de texte** : Extrait le texte des documents (PDF, DOCX, TXT, MD)
2. **Chunking** : Divise le texte en chunks pour une meilleure recherche
3. **Embedding** : Vectorise les chunks pour la recherche sémantique
4. **Stockage vectoriel** : Stocke les embeddings dans un système de fichiers
5. **Recherche sémantique** : Trouve les chunks les plus pertinents pour une question
6. **Génération de réponse** : Utilise LM Studio pour générer des réponses basées sur le contexte

## Configuration requise

### 1. LM Studio

1. Téléchargez et installez [LM Studio](https://lmstudio.ai/)
2. Chargez votre modèle : `DeepSeek-R1-Distill-Qwen-1.5B-GGUF`
3. Démarrez le serveur local dans LM Studio (généralement sur `http://localhost:1234`)

### 2. Dépendances optionnelles (pour extraction PDF/DOCX)

Pour extraire le texte des PDF et DOCX, installez les dépendances suivantes :

```bash
cd Backend
npm install pdf-parse mammoth
```

**Note** : Ces dépendances sont optionnelles. Le système fonctionnera avec les fichiers TXT et MD même sans elles.

### 3. Variables d'environnement

Ajoutez dans votre fichier `.env` du Backend :

```env
LM_STUDIO_URL=http://localhost:1234
```

## Utilisation

### Upload de documents

1. Allez dans une classe
2. Upload des documents (PDF, DOCX, TXT, MD)
3. Les documents sont automatiquement traités en arrière-plan :
   - Extraction du texte
   - Création de chunks
   - Génération d'embeddings
   - Stockage dans la base vectorielle

### Poser des questions

1. Allez dans l'onglet "Chat" de la classe
2. Posez une question sur le contenu des documents
3. L'assistant IA :
   - Recherche les chunks pertinents
   - Construit un contexte
   - Génère une réponse avec LM Studio

## Architecture

```
Document Upload
    ↓
DocumentProcessor (extraction texte)
    ↓
Chunking (division en morceaux)
    ↓
EmbeddingService (vectorisation)
    ↓
VectorStore (stockage)
    ↓
Question utilisateur
    ↓
RAGService (recherche + génération)
    ↓
LM Studio (génération réponse)
```

## Fichiers créés

- `Backend/src/services/documentProcessor.js` : Traitement des documents
- `Backend/src/services/embeddingService.js` : Génération d'embeddings
- `Backend/src/services/vectorStore.js` : Stockage vectoriel
- `Backend/src/services/ragService.js` : Service RAG principal
- `Backend/src/controllers/ragController.js` : Contrôleur API
- `Backend/src/routes/ragRoutes.js` : Routes API
- `Backend/vector_store/` : Répertoire de stockage des embeddings

## Dépannage

### LM Studio ne répond pas

1. Vérifiez que LM Studio est démarré
2. Vérifiez l'URL dans `.env` (par défaut `http://localhost:1234`)
3. Vérifiez que le modèle est chargé dans LM Studio

### Les documents ne sont pas traités

1. Vérifiez les logs du serveur backend
2. Assurez-vous que les fichiers sont accessibles
3. Pour PDF/DOCX, installez `pdf-parse` et `mammoth`

### Les réponses ne sont pas pertinentes

1. Vérifiez que les documents contiennent du texte extractible
2. Assurez-vous que les documents sont bien uploadés
3. Le système utilise un embedding simple - pour de meilleurs résultats, utilisez un modèle d'embedding plus avancé

## Améliorations futures

- Utiliser un modèle d'embedding plus avancé (sentence-transformers)
- Ajouter support pour plus de formats de fichiers
- Implémenter un cache pour les embeddings
- Ajouter un système de feedback pour améliorer les réponses

