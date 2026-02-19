// Script pour nettoyer les posts sans auteurs valides
import { MongoClient } from 'mongodb';

const ATLAS_URI = 'mongodb+srv://devgroupentreprise_db_user:LWC5S7GRgfB2KN84@cluster-dga-1.xylzvke.mongodb.net/';

async function cleanOrphanPosts() {
    const client = new MongoClient(ATLAS_URI);
    
    try {
        await client.connect();
        console.log('✓ Connecté à MongoDB Atlas');
        
        const authDb = client.db('mbolo_auth');
        const postDb = client.db('mbolo_post');
        
        // Récupérer tous les IDs d'utilisateurs valides
        const validUserIds = await authDb.collection('userAuths')
            .find({}, { projection: { _id: 1 } })
            .toArray();
        
        const validIds = validUserIds.map(u => u._id.toString());
        console.log(`✓ ${validIds.length} utilisateurs valides trouvés`);
        
        // Trouver les posts avec des auteurs invalides
        const orphanPosts = await postDb.collection('posts')
            .find({ authorId: { $nin: validIds } })
            .toArray();
        
        console.log(`✓ ${orphanPosts.length} posts orphelins trouvés`);
        
        if (orphanPosts.length > 0) {
            // Supprimer les posts orphelins
            const result = await postDb.collection('posts')
                .deleteMany({ authorId: { $nin: validIds } });
            
            console.log(`✓ ${result.deletedCount} posts orphelins supprimés`);
        }
        
        console.log('\n✅ Nettoyage terminé avec succès!');
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await client.close();
    }
}

cleanOrphanPosts();
