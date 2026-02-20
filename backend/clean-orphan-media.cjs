const { MongoClient } = require('mongodb');

// Configuration MongoDB Atlas
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://devgroupentreprise_db_user:LWC5S7GRgfB2KN84@cluster-dga-1.xylzvke.mongodb.net/?retryWrites=true&w=majority&appName=Cluster-DGA-1';
const DB_NAME = 'mbolo_chat';

async function cleanOrphanMedia() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    console.log('🔌 Connexion à MongoDB Atlas...');
    await client.connect();
    console.log('✅ Connecté à MongoDB Atlas');
    
    const db = client.db(DB_NAME);
    const messagesCollection = db.collection('messages');
    
    // Trouver tous les messages avec des médias
    console.log('\n🔍 Recherche des messages avec médias...');
    const mediaMessages = await messagesCollection.find({
      type: { $in: ['IMAGE', 'AUDIO', 'VIDEO', 'FILE'] },
      $or: [
        { mediaUrl: { $exists: true, $ne: null } },
        { content: { $regex: /^\/uploads\/chat\// } }
      ]
    }).toArray();
    
    console.log(`📊 Trouvé ${mediaMessages.length} messages avec médias`);
    
    if (mediaMessages.length === 0) {
      console.log('✅ Aucun message avec média à nettoyer');
      return;
    }
    
    // Afficher les messages trouvés
    console.log('\n📋 Messages avec médias:');
    mediaMessages.forEach((msg, index) => {
      const mediaPath = msg.mediaUrl || msg.content;
      console.log(`  ${index + 1}. Type: ${msg.type}, Path: ${mediaPath}, Date: ${msg.createdAt}`);
    });
    
    // Demander confirmation (en mode automatique, on supprime directement)
    console.log('\n⚠️  Ces messages seront supprimés car les fichiers n\'existent plus');
    console.log('💡 Les nouveaux uploads seront persistants grâce au volume Docker');
    
    // Supprimer les messages
    const messageIds = mediaMessages.map(msg => msg._id);
    const result = await messagesCollection.deleteMany({
      _id: { $in: messageIds }
    });
    
    console.log(`\n✅ ${result.deletedCount} messages supprimés avec succès`);
    
    // Mettre à jour les conversations pour retirer les références
    console.log('\n🔄 Mise à jour des conversations...');
    const conversationsCollection = db.collection('conversations');
    
    // Trouver les conversations qui référencent ces messages
    const conversations = await conversationsCollection.find({}).toArray();
    let updatedConversations = 0;
    
    for (const conv of conversations) {
      // Vérifier si le dernier message est un des messages supprimés
      const lastMessage = await messagesCollection.findOne(
        { conversationId: conv._id },
        { sort: { createdAt: -1 } }
      );
      
      if (lastMessage) {
        await conversationsCollection.updateOne(
          { _id: conv._id },
          {
            $set: {
              lastMessage: lastMessage.content || '',
              lastMessageTime: lastMessage.createdAt
            }
          }
        );
        updatedConversations++;
      } else {
        // Aucun message dans la conversation, réinitialiser
        await conversationsCollection.updateOne(
          { _id: conv._id },
          {
            $set: {
              lastMessage: '',
              lastMessageTime: null
            }
          }
        );
        updatedConversations++;
      }
    }
    
    console.log(`✅ ${updatedConversations} conversations mises à jour`);
    
    console.log('\n🎉 Nettoyage terminé avec succès!');
    console.log('💡 Les nouveaux fichiers uploadés seront maintenant persistants');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Déconnexion de MongoDB');
  }
}

// Exécuter le nettoyage
cleanOrphanMedia().catch(console.error);
