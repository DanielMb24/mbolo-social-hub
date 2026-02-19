# 🗄️ Référence Rapide - Base de Données MBolo

## 🚀 Commandes Essentielles

### Initialisation

```bash
# Initialisation basique
cd backend
./init-databases.sh          # Linux/Mac
init-databases.bat           # Windows

# Initialisation avancée (avec tous les index)
./init-databases-advanced.sh # Linux/Mac
```

### Données de Test

```bash
# Insérer des données de test
cd backend
./seed-test-data.sh          # Linux/Mac
seed-test-data.bat           # Windows

# Identifiants créés:
# Username: testuser
# Email: test@mbolo.com
# Password: test123
```

### Vérification

```bash
# Vérifier toutes les bases
cd backend
./verify-databases.sh        # Linux/Mac
verify-databases.bat         # Windows
```

---

## 📊 Structure des Bases

### 6 Instances MongoDB

| Base | Port | Collections | Usage |
|------|------|-------------|-------|
| mbolo_auth | 27017 | users_auth, refresh_tokens | Authentification |
| mbolo_user | 27018 | user_profiles, followers, following | Profils |
| mbolo_chat | 27019 | conversations, messages | Messagerie |
| mbolo_post | 27020 | posts, comments, likes | Publications |
| mbolo_video | 27021 | videos, video_likes, video_views | Vidéos |
| mbolo_moderation | 27022 | reports, banned_users, audit_logs | Modération |

---

## 🔌 Connexion

```bash
# Se connecter à une base
docker exec -it mbolo-mongo-auth mongosh mbolo_auth
docker exec -it mbolo-mongo-user mongosh mbolo_user
docker exec -it mbolo-mongo-chat mongosh mbolo_chat
docker exec -it mbolo-mongo-post mongosh mbolo_post
docker exec -it mbolo-mongo-video mongosh mbolo_video
docker exec -it mbolo-mongo-moderation mongosh mbolo_moderation
```

---

## 📝 Requêtes Courantes

### Utilisateurs

```javascript
// Compter les utilisateurs
db.users_auth.countDocuments()

// Voir tous les utilisateurs
db.users_auth.find().pretty()

// Trouver un utilisateur
db.users_auth.findOne({ username: "testuser" })

// Chercher par email
db.users_auth.findOne({ email: "test@mbolo.com" })
```

### Posts

```javascript
// Derniers posts
db.posts.find().sort({ createdAt: -1 }).limit(10)

// Posts d'un utilisateur
db.posts.find({ userId: "1" }).sort({ createdAt: -1 })

// Compter les posts
db.posts.countDocuments()
```

### Messages

```javascript
// Conversations
db.conversations.find().pretty()

// Messages d'une conversation
db.messages.find({ conversationId: "conv_id" }).sort({ timestamp: -1 })

// Messages non lus
db.messages.find({ read: false }).count()
```

### Vidéos

```javascript
// Vidéos les plus vues
db.videos.find().sort({ views: -1 }).limit(10)

// Vidéos récentes
db.videos.find().sort({ createdAt: -1 }).limit(10)
```

---

## 🔧 Maintenance

### Backup

```bash
# Backup d'une base
docker exec mbolo-mongo-auth mongodump --db=mbolo_auth --out=/backup

# Backup de toutes les bases
docker exec mbolo-mongo-auth mongodump --out=/backup
```

### Restore

```bash
# Restore d'une base
docker exec mbolo-mongo-auth mongorestore --db=mbolo_auth /backup/mbolo_auth
```

### Nettoyage

```bash
# Supprimer toutes les données (⚠️ ATTENTION)
docker exec mbolo-mongo-auth mongosh mbolo_auth --eval "db.dropDatabase()"

# Supprimer une collection
docker exec mbolo-mongo-auth mongosh mbolo_auth --eval "db.users_auth.drop()"

# Vider une collection
docker exec mbolo-mongo-auth mongosh mbolo_auth --eval "db.users_auth.deleteMany({})"
```

---

## 📈 Statistiques

```javascript
// Statistiques de la base
db.stats()

// Statistiques d'une collection
db.users_auth.stats()

// Taille de la base
db.stats().dataSize

// Nombre total de documents
db.stats().objects
```

---

## 🔍 Index

```javascript
// Voir les index d'une collection
db.users_auth.getIndexes()

// Créer un index
db.users_auth.createIndex({ username: 1 }, { unique: true })

// Supprimer un index
db.users_auth.dropIndex("username_1")

// Recréer tous les index
db.users_auth.reIndex()
```

---

## 🆘 Dépannage

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

### Problème: Connexion refusée

```bash
# Vérifier que MongoDB est démarré
docker ps | grep mongo

# Redémarrer MongoDB
cd backend
docker-compose restart mongo-auth
```

### Problème: Performances lentes

```javascript
// Vérifier les index
db.users_auth.getIndexes()

// Analyser une requête
db.users_auth.find({ username: "test" }).explain("executionStats")

// Activer le profiling
db.setProfilingLevel(1)
db.system.profile.find().pretty()
```

---

## 📚 Documentation Complète

Pour plus de détails, consultez: **[DATABASE.md](./DATABASE.md)**

---

## 💡 Astuces

### Recherche Rapide

```javascript
// Recherche insensible à la casse
db.users_auth.find({ username: /testuser/i })

// Recherche avec regex
db.posts.find({ content: /mbolo/i })

// Recherche dans un tableau
db.user_profiles.find({ blockedUsers: "userId123" })
```

### Agrégation

```javascript
// Compter les posts par utilisateur
db.posts.aggregate([
  { $group: { _id: "$userId", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])

// Posts avec le plus de likes
db.posts.aggregate([
  { $sort: { likes: -1 } },
  { $limit: 10 }
])
```

### Mise à Jour

```javascript
// Mettre à jour un document
db.users_auth.updateOne(
  { username: "testuser" },
  { $set: { isVerified: true } }
)

// Incrémenter un compteur
db.posts.updateOne(
  { _id: ObjectId("...") },
  { $inc: { likes: 1 } }
)

// Ajouter à un tableau
db.user_profiles.updateOne(
  { userId: "1" },
  { $push: { blockedUsers: "userId123" } }
)
```

---

**💡 Conseil:** Gardez ce fichier à portée de main pour les opérations quotidiennes!
