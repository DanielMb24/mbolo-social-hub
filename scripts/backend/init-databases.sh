#!/bin/bash

echo "🗄️  Initialisation des bases de données MongoDB..."

# Attendre que MongoDB soit prêt
sleep 5

# Fonction pour créer un utilisateur et une base de données
create_db() {
    local port=$1
    local dbname=$2
    
    echo "Creating database: $dbname on port $port"
    
    docker exec mbolo-mongo-auth mongosh --port 27017 --eval "
        use $dbname;
        db.createCollection('_init');
        db._init.insertOne({initialized: true, date: new Date()});
        print('Database $dbname initialized');
    " 2>/dev/null || echo "Database $dbname already exists or error occurred"
}

# Créer les bases de données
echo "📦 Création des bases de données..."

docker exec mbolo-mongo-auth mongosh --eval "
    use mbolo_auth;
    db.createCollection('users');
    db.createCollection('refresh_tokens');
    db.users.createIndex({ username: 1 }, { unique: true });
    db.users.createIndex({ email: 1 }, { unique: true });
    print('Auth database initialized');
"

docker exec mbolo-mongo-user mongosh --eval "
    use mbolo_user;
    db.createCollection('user_profiles');
    db.user_profiles.createIndex({ userId: 1 }, { unique: true });
    db.user_profiles.createIndex({ username: 1 }, { unique: true });
    print('User database initialized');
"

docker exec mbolo-mongo-chat mongosh --eval "
    use mbolo_chat;
    db.createCollection('conversations');
    db.createCollection('messages');
    db.messages.createIndex({ conversationId: 1, timestamp: -1 });
    db.conversations.createIndex({ participants: 1 });
    print('Chat database initialized');
"

docker exec mbolo-mongo-post mongosh --eval "
    use mbolo_post;
    db.createCollection('posts');
    db.createCollection('comments');
    db.posts.createIndex({ userId: 1, createdAt: -1 });
    db.posts.createIndex({ createdAt: -1 });
    db.comments.createIndex({ postId: 1, createdAt: -1 });
    print('Post database initialized');
"

docker exec mbolo-mongo-video mongosh --eval "
    use mbolo_video;
    db.createCollection('videos');
    db.videos.createIndex({ userId: 1, createdAt: -1 });
    db.videos.createIndex({ createdAt: -1 });
    db.videos.createIndex({ views: -1 });
    print('Video database initialized');
"

docker exec mbolo-mongo-moderation mongosh --eval "
    use mbolo_moderation;
    db.createCollection('reports');
    db.createCollection('banned_users');
    db.createCollection('audit_logs');
    db.reports.createIndex({ status: 1, createdAt: -1 });
    db.banned_users.createIndex({ userId: 1 }, { unique: true });
    db.audit_logs.createIndex({ createdAt: -1 });
    print('Moderation database initialized');
"

echo "✅ Bases de données initialisées avec succès!"
echo ""
echo "💡 Pour insérer des données de test:"
echo "   ./seed-test-data.sh"
echo ""
echo "🔍 Pour vérifier les bases:"
echo "   ./verify-databases.sh"
