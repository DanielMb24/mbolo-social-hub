#!/bin/bash

echo "🗄️  Initialisation avancée des bases de données MongoDB..."
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Attendre que MongoDB soit prêt
echo "⏳ Attente du démarrage de MongoDB..."
sleep 10

# Fonction pour initialiser une base de données
init_database() {
    local container=$1
    local dbname=$2
    local collections=$3
    
    echo -e "${YELLOW}📦 Initialisation de $dbname...${NC}"
    
    docker exec $container mongosh --eval "
        use $dbname;
        
        // Créer les collections
        $collections
        
        print('✅ Base de données $dbname initialisée');
    " 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $dbname OK${NC}"
    else
        echo "❌ Erreur lors de l'initialisation de $dbname"
    fi
}

# Auth Database
init_database "mbolo-mongo-auth" "mbolo_auth" "
    db.createCollection('users_auth');
    db.createCollection('refresh_tokens');
    
    // Index
    db.users_auth.createIndex({ username: 1 }, { unique: true });
    db.users_auth.createIndex({ email: 1 }, { unique: true });
    db.users_auth.createIndex({ phone: 1 }, { sparse: true });
    db.users_auth.createIndex({ createdAt: -1 });
    
    db.refresh_tokens.createIndex({ token: 1 }, { unique: true });
    db.refresh_tokens.createIndex({ userId: 1 });
    db.refresh_tokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    
    print('Auth database: collections et index créés');
"

# User Database
init_database "mbolo-mongo-user" "mbolo_user" "
    db.createCollection('user_profiles');
    db.createCollection('followers');
    db.createCollection('following');
    
    // Index
    db.user_profiles.createIndex({ userId: 1 }, { unique: true });
    db.user_profiles.createIndex({ username: 1 }, { unique: true });
    db.user_profiles.createIndex({ fullname: 'text' });
    db.user_profiles.createIndex({ createdAt: -1 });
    
    db.followers.createIndex({ userId: 1, followerId: 1 }, { unique: true });
    db.following.createIndex({ userId: 1, followingId: 1 }, { unique: true });
    
    print('User database: collections et index créés');
"

# Chat Database
init_database "mbolo-mongo-chat" "mbolo_chat" "
    db.createCollection('conversations');
    db.createCollection('messages');
    
    // Index
    db.conversations.createIndex({ participants: 1 });
    db.conversations.createIndex({ updatedAt: -1 });
    db.conversations.createIndex({ 'participants.0': 1, 'participants.1': 1 }, { unique: true });
    
    db.messages.createIndex({ conversationId: 1, timestamp: -1 });
    db.messages.createIndex({ senderId: 1, timestamp: -1 });
    db.messages.createIndex({ conversationId: 1, read: 1 });
    
    print('Chat database: collections et index créés');
"

# Post Database
init_database "mbolo-mongo-post" "mbolo_post" "
    db.createCollection('posts');
    db.createCollection('comments');
    db.createCollection('likes');
    
    // Index
    db.posts.createIndex({ userId: 1, createdAt: -1 });
    db.posts.createIndex({ createdAt: -1 });
    db.posts.createIndex({ userId: 1 });
    
    db.comments.createIndex({ postId: 1, createdAt: -1 });
    db.comments.createIndex({ userId: 1, createdAt: -1 });
    
    db.likes.createIndex({ postId: 1, userId: 1 }, { unique: true });
    db.likes.createIndex({ userId: 1, createdAt: -1 });
    
    print('Post database: collections et index créés');
"

# Video Database
init_database "mbolo-mongo-video" "mbolo_video" "
    db.createCollection('videos');
    db.createCollection('video_likes');
    db.createCollection('video_views');
    
    // Index
    db.videos.createIndex({ userId: 1, createdAt: -1 });
    db.videos.createIndex({ createdAt: -1 });
    db.videos.createIndex({ views: -1 });
    db.videos.createIndex({ likes: -1 });
    db.videos.createIndex({ title: 'text', description: 'text' });
    
    db.video_likes.createIndex({ videoId: 1, userId: 1 }, { unique: true });
    db.video_views.createIndex({ videoId: 1, userId: 1, viewedAt: -1 });
    
    print('Video database: collections et index créés');
"

# Moderation Database
init_database "mbolo-mongo-moderation" "mbolo_moderation" "
    db.createCollection('reports');
    db.createCollection('banned_users');
    db.createCollection('audit_logs');
    
    // Index
    db.reports.createIndex({ status: 1, createdAt: -1 });
    db.reports.createIndex({ contentId: 1, contentType: 1 });
    db.reports.createIndex({ reportedBy: 1, createdAt: -1 });
    
    db.banned_users.createIndex({ userId: 1 }, { unique: true });
    db.banned_users.createIndex({ bannedAt: -1 });
    db.banned_users.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    
    db.audit_logs.createIndex({ action: 1, createdAt: -1 });
    db.audit_logs.createIndex({ userId: 1, createdAt: -1 });
    db.audit_logs.createIndex({ createdAt: -1 });
    
    print('Moderation database: collections et index créés');
"

echo ""
echo -e "${GREEN}✅ Toutes les bases de données ont été initialisées avec succès!${NC}"
echo ""
echo "📊 Résumé:"
echo "   - Auth: users_auth, refresh_tokens"
echo "   - User: user_profiles, followers, following"
echo "   - Chat: conversations, messages"
echo "   - Post: posts, comments, likes"
echo "   - Video: videos, video_likes, video_views"
echo "   - Moderation: reports, banned_users, audit_logs"
echo ""
echo "🔍 Pour vérifier:"
echo "   docker exec mbolo-mongo-auth mongosh mbolo_auth --eval 'db.getCollectionNames()'"
