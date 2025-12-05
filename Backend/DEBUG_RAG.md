# Guide de débogage RAG

## Vérifier l'état du système RAG

### 1. Endpoint de diagnostic

Appelez cette URL pour vérifier l'état :
```
GET /api/rag/class/{classId}/status
```

Cela vous donnera :
- Nombre de documents uploadés
- Nombre d'embeddings créés
- État de la connexion LM Studio
- Statut général

### 2. Vérifier les logs du serveur

Après l'upload d'un document, vous devriez voir :
```
[RAG] Début du traitement du document X...
[RAG] Texte extrait: Y caractères
[RAG] X chunks créés
[RAG] ✅ Document traité avec succès
```

### 3. Vérifier les fichiers vectoriels

Les embeddings sont sauvegardés dans :
```
Backend/vector_store/class_{classId}.json
```

Vérifiez que ces fichiers existent et contiennent des données.

### 4. Tester LM Studio

Vérifiez que LM Studio est démarré :
- Ouvrez LM Studio
- Chargez votre modèle
- Démarrrez le serveur local (généralement port 1234)
- L'endpoint de diagnostic vous dira si la connexion fonctionne

### 5. Tester avec un fichier simple

1. Créez un fichier `test.txt` avec ce contenu :
```
Ceci est un test. Le système RAG devrait pouvoir répondre à des questions sur ce contenu.
L'assistant IA peut extraire des informations de ce document.
```

2. Uploadez-le dans une classe
3. Attendez 5-10 secondes
4. Posez la question : "Qu'est-ce que le système RAG peut faire ?"
5. Vérifiez les logs du serveur

## Problèmes courants

### Aucun embedding créé
- Vérifiez que le fichier est bien uploadé
- Vérifiez les logs pour voir si l'extraction de texte fonctionne
- Pour PDF/DOCX, installez : `npm install pdf-parse mammoth`

### LM Studio ne répond pas
- Vérifiez que LM Studio est démarré
- Vérifiez l'URL dans `.env` : `LM_STUDIO_URL=http://localhost:1234`
- Le système utilisera un fallback si LM Studio n'est pas disponible

### Aucun résultat trouvé
- Le seuil de similarité est à 0.05 (très bas)
- Vérifiez que les embeddings sont bien sauvegardés
- Essayez de reformuler votre question


