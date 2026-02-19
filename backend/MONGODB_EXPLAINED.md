# 📚 MongoDB Expliqué - Pour Débutants

## 🤔 Pourquoi les "tables" n'existent pas?

### MongoDB ≠ SQL

| SQL (MySQL, PostgreSQL) | MongoDB |
|------------------------|---------|
| Base de données | Base de données ✅ |
| **Tables** | **Collections** |
| Lignes | Documents |
| Colonnes | Champs |
| Schema fixe | Schema flexible |

## 🎯 Comment ça fonctionne dans MBolo?

### 1️⃣ Docker Crée les Conteneurs

```bash
docker-compose up -d
```

Cela crée:
- ✅ 6 conteneurs MongoDB (mongo-auth, mongo-user, etc.)
- ✅ Les serveurs MongoDB sont démarrés
- ❌ Mais les bases de données sont VIDES

### 2️⃣ Deux Façons de Créer les Collections

#### Option A: Scripts Manuels (Recommandé pour le développement)

```bash
.\init-databases.bat
```

Ce script:
1. Se connecte à chaque conteneur MongoDB
2. Crée les bases de données (mbolo_auth, mbolo_user, etc.)
3. Crée les collections (users_auth, posts, etc.)
4. Crée les index pour la performance

**Avantage:** Vous contrôlez exactement ce qui est créé

#### Option B: Spring Boot Automatique (Production)

Quand vous démarrez les services Java:

```bash
docker-compose up -d auth-service
```

Spring Boot:
1. Se connecte à MongoDB
2. Lit vos classes Java avec `@Document`
3. Crée automatiquement les collections
4. Crée les index définis dans le code

**Avantage:** Pas besoin de scripts, tout est dans le code

## 🔍 Vérifier si les Collections Existent

### Méthode 1: Script de Vérification

```bash
.\check-mongodb.bat
```

### Méthode 2: Connexion Manuelle

```bash
# Se connecter à MongoDB Auth
docker exec -it mbolo-mongo-auth mongosh mbolo_auth

# Dans le shell MongoDB:
show collections
db.users_auth.find()
```

### Méthode 3: Docker Desktop

1. Ouvrez Docker Desktop
2. Cliquez sur le conteneur `mbolo-mongo-auth`
3. Onglet "Exec" → Tapez: `mongosh mbolo_auth`
4. Tapez: `show collections`

## 📊 Structure Actuelle

```
Docker Containers (6 MongoDB):
├── mbolo-mongo-auth (port 27017)
│   └── Base: mbolo_auth
│       ├── Collection: users_auth
│       └── Collection: refresh_tokens
│
├── mbolo-mongo-user (port 27018)
│   └── Base: mbolo_user
│       └── Collection: user_profiles
│
├── mbolo-mongo-chat (port 27019)
│   └── Base: mbolo_chat
│       ├── Collection: conversations
│       └── Collection: messages
│
├── mbolo-mongo-post (port 27020)
│   └── Base: mbolo_post
│       ├── Collection: posts
│       └── Collection: comments
│
├── mbolo-mongo-video (port 27021)
│   └── Base: mbolo_video
│       └── Collection: videos
│
└── mbolo-mongo-moderation (port 27022)
    └── Base: mbolo_moderation
        ├── Collection: reports
        └── Collection: banned_users
```

## 🚀 Workflow Complet

### Étape 1: Démarrer Docker

```bash
cd backend
docker-compose up -d
```

**Résultat:** 14 conteneurs démarrés (6 MongoDB + 7 services + Redis + MinIO)

### Étape 2: Vérifier que MongoDB est Prêt

```bash
docker ps | findstr mongo
```

Vous devriez voir 6 conteneurs MongoDB "Up"

### Étape 3: Créer les Collections

```bash
.\init-databases.bat
```

**Résultat:** Collections créées dans chaque base

### Étape 4: Insérer des Données de Test

```bash
.\seed-test-data.bat
```

**Résultat:** Utilisateur "testuser" créé

### Étape 5: Vérifier

```bash
.\check-mongodb.bat
```

**Résultat:** Vous voyez les collections et le nombre de documents

## 💡 Pourquoi Cette Architecture?

### Avantages de MongoDB:

1. **Flexible:** Pas besoin de définir le schéma à l'avance
2. **Rapide:** Optimisé pour les lectures/écritures rapides
3. **Scalable:** Facile à distribuer sur plusieurs serveurs
4. **JSON natif:** Parfait pour les APIs REST

### Avantages de Docker:

1. **Isolation:** Chaque service a sa propre base
2. **Portable:** Fonctionne partout (Windows, Mac, Linux)
3. **Facile:** Un seul `docker-compose up` démarre tout
4. **Propre:** `docker-compose down` nettoie tout

## 🆘 Problèmes Courants

### "No such container"

**Problème:** Docker n'est pas démarré

**Solution:**
```bash
docker-compose up -d
```

### "Collections vides"

**Problème:** Les scripts n'ont pas été exécutés

**Solution:**
```bash
.\init-databases.bat
.\seed-test-data.bat
```

### "Cannot connect to MongoDB"

**Problème:** Les services Java utilisent le mauvais profil

**Solution:** Vérifiez que `application-docker.yml` existe et utilise les bons noms de services

## 📝 Exemple Concret

### Créer un Utilisateur Manuellement

```bash
# Se connecter à MongoDB
docker exec -it mbolo-mongo-auth mongosh mbolo_auth

# Dans le shell MongoDB:
db.users_auth.insertOne({
  username: "john",
  email: "john@example.com",
  password: "$2a$12$...",  // Hash BCrypt
  roles: ["ROLE_USER"],
  isActive: true,
  createdAt: new Date()
})

# Vérifier
db.users_auth.find()
```

### Voir les Utilisateurs

```bash
docker exec mbolo-mongo-auth mongosh mbolo_auth --eval "db.users_auth.find().pretty()"
```

## 🎓 Résumé

1. **Docker** = Conteneurs qui font tourner MongoDB
2. **MongoDB** = Base de données NoSQL (pas de tables, mais des collections)
3. **Collections** = Créées automatiquement ou par scripts
4. **Spring Boot** = Lit/écrit dans MongoDB via les collections
5. **Vous** = Pouvez vérifier/modifier via `mongosh` ou scripts

**C'est tout! Pas de CREATE TABLE, pas de schéma fixe, juste des documents JSON!** 🎉
