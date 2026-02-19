# 🗄️ Guide de la Base de Données - MBolo

## Architecture MongoDB

MBolo utilise 6 instances MongoDB dédiées, une par domaine fonctionnel.

### Instances MongoDB

| Instance | Port | Base de Données | Collections |
|----------|------|-----------------|-------------|
| mongo-auth | 27017 | mbolo_auth | users_auth, refresh_tokens |
| mongo-user | 27018 | mbolo_user | user_profiles, followers, following |
| mongo-chat | 27019 | mbolo_chat | conversations, messages |
| mongo-post | 27020 | mbolo_post | posts, comments, likes |
| mongo-video | 27021 | mbolo_video | videos, video_likes, video_views |
| mongo-moderation | 27022 | mbolo_moderation | reports, banned_users, audit_logs |

---

## 📊 Schémas de Données

### 1. Auth Database (mbolo_auth)

#### Collection: users_auth
```javascript
{
  _id: ObjectId,
  username: String (unique, indexed),
  email: String (unique, indexed),
  phone: String (sparse index),
  password: String (BCrypt hash),
  fullName: String,
  roles: [String], // ['ROLE_USER', 'ROLE_ADMIN']
  isActive: Boolean,
  isVerified: Boolean,
  createdAt: Date (indexed)
}
```

#### Collection: refresh_tokens
```javascript
{
  _id: ObjectId,
  userId: String (indexed),
  token: String (unique, indexed),
  expiresAt: Date (TTL index),
  createdAt: Date
}
```

### 2. User Database (mbolo_user)

#### Collection: user_profiles
```javascript
{
  _id: ObjectId,
  userId: String (unique, indexed),
  username: String (unique, indexed),
  fullname: String (text index),
  bio: String,
  location: String,
  avatarUrl: String,
  followersCount: Number,
  followingCount: Number,
  postsCount: Number,
  blockedUsers: [String],
  createdAt: Date (indexed)
}
```

#### Collection: followers
```javascript
{
  _id: ObjectId,
  userId: String,
  followerId: String,
  createdAt: Date
}
// Index composé: { userId: 1, followerId: 1 } unique
```

#### Collection: following
```javascript
{
  _id: ObjectId,
  userId: String,
  followingId: String,
  createdAt: Date
}
// Index composé: { userId: 1, followingId: 1 } unique
```

### 3. Chat Database (mbolo_chat)

#### Collection: conversations
```javascript
{
  _id: ObjectId,
  participants: [String], // [userId1, userId2] (indexed)
  lastMessage: {
    content: String,
    senderId: String,
    timestamp: Date
  },
  updatedAt: Date (indexed)
}
// Index composé: { 'participants.0': 1, 'participants.1': 1 } unique
```

#### Collection: messages
```javascript
{
  _id: ObjectId,
  conversationId: String (indexed),
  senderId: String (indexed),
  content: String,
  timestamp: Date,
  read: Boolean,
  createdAt: Date
}
// Index composé: { conversationId: 1, timestamp: -1 }
// Index composé: { conversationId: 1, read: 1 }
```

### 4. Post Database (mbolo_post)

#### Collection: posts
```javascript
{
  _id: ObjectId,
  userId: String (indexed),
  content: String,
  mediaUrls: [String],
  likes: Number,
  comments: Number,
  createdAt: Date (indexed),
  updatedAt: Date
}
// Index composé: { userId: 1, createdAt: -1 }
```

#### Collection: comments
```javascript
{
  _id: ObjectId,
  postId: String (indexed),
  userId: String (indexed),
  content: String,
  createdAt: Date
}
// Index composé: { postId: 1, createdAt: -1 }
```

#### Collection: likes
```javascript
{
  _id: ObjectId,
  postId: String,
  userId: String,
  createdAt: Date
}
// Index composé: { postId: 1, userId: 1 } unique
```

### 5. Video Database (mbolo_video)

#### Collection: videos
```javascript
{
  _id: ObjectId,
  userId: String (indexed),
  title: String (text index),
  description: String (text index),
  videoUrl: String,
  thumbnailUrl: String,
  views: Number (indexed),
  likes: Number (indexed),
  duration: Number,
  createdAt: Date (indexed),
  updatedAt: Date
}
```

#### Collection: video_likes
```javascript
{
  _id: ObjectId,
  videoId: String,
  userId: String,
  createdAt: Date
}
// Index composé: { videoId: 1, userId: 1 } unique
```

#### Collection: video_views
```javascript
{
  _id: ObjectId,
  videoId: String,
  userId: String,
  viewedAt: Date
}
// Index composé: { videoId: 1, userId: 1, viewedAt: -1 }
```

### 6. Moderation Database (mbolo_moderation)

#### Collection: reports
```javascript
{
  _id: ObjectId,
  contentId: String (indexed),
  contentType: String, // 'post', 'video', 'comment', 'user'
  reason: String,
  reportedBy: String (indexed),
  status: String, // 'pending', 'approved', 'rejected'
  createdAt: Date (indexed),
  resolvedAt: Date,
  resolvedBy: String
}
// Index composé: { status: 1, createdAt: -1 }
// Index composé: { contentId: 1, contentType: 1 }
```

#### Collection: banned_users
```javascript
{
  _id: ObjectId,
  userId: String (unique, indexed),
  reason: String,
  bannedBy: String,
  bannedAt: Date (indexed),
  expiresAt: Date (TTL index),
  permanent: Boolean
}
```

#### Collection: audit_logs
```javascript
{
  _id: ObjectId,
  action: String (indexed),
  userId: String (indexed),
  targetId: String,
  details: Object,
  createdAt: Date (indexed)
}
```

---

## 🚀 Scripts de Gestion

### Initialisation

```bash
# Initialisation basique
cd backend
./init-databases.sh      # Linux/Mac
init-databases.bat       # Windows

# Initialisation avancée (avec tous les index)
./init-databases-advanced.sh    # Linux/Mac
```

### Données de Test

```bash
# Insérer des données de test
cd backend
./seed-test-data.sh      # Linux/Mac
seed-test-data.bat       # Windows

# Identifiants créés:
# Username: testuser
# Email: test@mbolo.com
# Password: test123
```

### Vérification

```bash
# Vérifier toutes les bases
cd backend
./verify-databases.sh    # Linux/Mac
verify-databases.bat     # Windows
```

---

## 🔧 Commandes MongoDB Utiles

### Connexion

```bash
# Se connecter à une base
docker exec -it mbolo-mongo-auth mongosh mbolo_auth
docker exec -it mbolo-mongo-user mongosh mbolo_user
docker exec -it mbolo-mongo-chat mongosh mbolo_chat
docker exec -it mbolo-mongo-post mongosh mbolo_post
docker exec -it mbolo-mongo-video mongosh mbolo_video
docker exec -it mbolo-mongo-moderation mongosh mbolo_moderation
```

### Requêtes Courantes

```javascript
// Lister les collections
show collections

// Compter les documents
db.users_auth.countDocuments()

// Voir tous les utilisateurs
db.users_auth.find().pretty()

// Trouver un utilisateur par username
db.users_auth.findOne({ username: "testuser" })

// Voir les index
db.users_auth.getIndexes()

// Voir les derniers posts
db.posts.find().sort({ createdAt: -1 }).limit(10)

// Compter les posts par utilisateur
db.posts.aggregate([
  { $group: { _id: "$userId", count: { $sum: 1 } } }
])

// Voir les conversations
db.conversations.find().pretty()

// Voir les messages d'une conversation
db.messages.find({ conversationId: "conv_id" }).sort({ timestamp: -1 })
```

### Maintenance

```bash
# Backup d'une base
docker exec mbolo-mongo-auth mongodump --db=mbolo_auth --out=/backup

# Restore d'une base
docker exec mbolo-mongo-auth mongorestore --db=mbolo_auth /backup/mbolo_auth

# Supprimer toutes les données (⚠️ ATTENTION)
docker exec mbolo-mongo-auth mongosh mbolo_auth --eval "db.dropDatabase()"

# Recréer les index
docker exec mbolo-mongo-auth mongosh mbolo_auth --eval "db.users_auth.reIndex()"
```

---

## 📈 Optimisations

### Index Créés

Tous les index sont créés automatiquement par les scripts d'initialisation:

- **Index uniques** sur username, email
- **Index composés** pour les requêtes fréquentes
- **Index de texte** pour la recherche
- **TTL index** pour l'expiration automatique des tokens
- **Index sur les dates** pour le tri chronologique

### Performance

- Pagination sur toutes les listes
- Index optimisés pour les requêtes fréquentes
- Connexions poolées dans Spring Boot
- Cache Redis pour les données fréquemment accédées

---

## 🔍 Monitoring

### Statistiques

```javascript
// Statistiques d'une base
db.stats()

// Statistiques d'une collection
db.users_auth.stats()

// Opérations en cours
db.currentOp()

// Profiling
db.setProfilingLevel(1) // Log slow queries
db.system.profile.find().pretty()
```

### Logs

```bash
# Voir les logs MongoDB
docker logs mbolo-mongo-auth
docker logs -f mbolo-mongo-auth --tail=100
```

---

## 🆘 Troubleshooting

### Problème: Collections non créées

```bash
cd backend
./init-databases-advanced.sh
```

### Problème: Pas de données

```bash
cd backend
./seed-test-data.sh
```

### Problème: Index manquants

```bash
docker exec mbolo-mongo-auth mongosh mbolo_auth --eval "
  db.users_auth.createIndex({ username: 1 }, { unique: true });
  db.users_auth.createIndex({ email: 1 }, { unique: true });
"
```

### Problème: Connexion refusée

```bash
# Vérifier que MongoDB est démarré
docker ps | grep mongo

# Redémarrer MongoDB
cd backend
docker-compose restart mongo-auth
```

---

## 📚 Ressources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [MongoDB Indexes](https://docs.mongodb.com/manual/indexes/)
- [MongoDB Aggregation](https://docs.mongodb.com/manual/aggregation/)
- [Spring Data MongoDB](https://spring.io/projects/spring-data-mongodb)
