// Script de test pour vérifier le système RAG
const vectorStore = require('../services/vectorStore');
const embeddingService = require('../services/embeddingService');
const ragService = require('../services/ragService');

async function testRAG(classId) {
  console.log('\n=== TEST DU SYSTÈME RAG ===\n');
  
  // 1. Vérifier les embeddings
  console.log('1. Vérification des embeddings...');
  const embeddings = vectorStore.loadClassEmbeddings(classId);
  console.log(`   Embeddings trouvés: ${embeddings.length}`);
  
  if (embeddings.length === 0) {
    console.log('   ❌ Aucun embedding trouvé. Les documents doivent être traités.');
    return;
  }
  
  console.log(`   ✅ ${embeddings.length} embeddings disponibles`);
  console.log(`   Documents avec embeddings: ${[...new Set(embeddings.map(e => e.documentId))].length}`);
  
  // 2. Tester l'embedding d'une question
  console.log('\n2. Test de génération d\'embedding...');
  const testQuestion = "Qu'est-ce que le système RAG ?";
  const questionEmbedding = await embeddingService.generateEmbedding(testQuestion);
  console.log(`   Question: "${testQuestion}"`);
  console.log(`   Embedding généré: ${questionEmbedding ? 'Oui' : 'Non'} (dimension: ${questionEmbedding?.length || 0})`);
  
  // 3. Tester la recherche
  console.log('\n3. Test de recherche vectorielle...');
  const results = vectorStore.search(classId, questionEmbedding, 5);
  console.log(`   Résultats trouvés: ${results.length}`);
  if (results.length > 0) {
    results.forEach((r, i) => {
      console.log(`   ${i + 1}. Similarité: ${r.similarity.toFixed(3)}, Document: ${r.documentId}`);
      console.log(`      Aperçu: ${r.text.substring(0, 100)}...`);
    });
  }
  
  // 4. Tester la génération de réponse
  console.log('\n4. Test de génération de réponse...');
  try {
    const response = await ragService.generateResponse(classId, testQuestion);
    console.log(`   Réponse générée: ${response.answer.substring(0, 200)}...`);
    console.log(`   Sources: ${response.sources.length}`);
  } catch (error) {
    console.error(`   ❌ Erreur: ${error.message}`);
  }
  
  // 5. Tester LM Studio
  console.log('\n5. Test de connexion LM Studio...');
  const lmStatus = await ragService.testLMStudioConnection();
  console.log(`   Connecté: ${lmStatus.connected ? 'Oui' : 'Non'}`);
  if (!lmStatus.connected) {
    console.log(`   Erreur: ${lmStatus.error}`);
  }
  
  console.log('\n=== FIN DU TEST ===\n');
}

// Exécuter le test si appelé directement
if (require.main === module) {
  const classId = process.argv[2];
  if (!classId) {
    console.error('Usage: node testRAG.js <classId>');
    process.exit(1);
  }
  testRAG(parseInt(classId)).then(() => process.exit(0));
}

module.exports = { testRAG };


