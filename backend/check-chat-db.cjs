const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb+srv://devgroupentreprise_db_user:LWC5S7GRgfB2KN84@cluster-dga-1.xylzvke.mongodb.net/?retryWrites=true&w=majority&appName=Cluster-DGA-1';
const DB_NAME = 'mbolo_chat';

async function checkDatabase() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    console.log('🔌 Connexion à MongoDB Atlas...');
    await client.connect();
    console.log('✅ Connecté à MongoDB Atlas');
    
    const db = client.db(DB_NAME);
    
    // Lister toutes les collections
    console.log('\n📚 Collections dans la base:');
    const collections = await db.listCollections().toArray();
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    // Compter les documents dans chaque collection
    console.log('\n📊 Nombre de documents:');
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`  - ${col.name}: ${count} documents`);
    }
    
    // Afficher quelques messages
    const messagesCollection = db.collection('messages');
    const messages = await messagesCollection.find({}).limit(10).toArray();
    
    console.log('\n📝 Derniers messages:');
    messages.forEach((msg, index) => {
      console.log(`  ${index + 1}. Type: ${msg.type}, Content: ${msg.content?.substring(0, 50) || 'N/A'}, MediaURL: ${msg.mediaUrl || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Déconnexion de MongoDB');
  }
}

checkDatabase().catch(console.error);
