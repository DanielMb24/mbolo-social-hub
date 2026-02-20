# 🚀 Guide de Déploiement sur Render.com

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Préparation](#préparation)
3. [Déploiement Automatique](#déploiement-automatique)
4. [Déploiement Manuel](#déploiement-manuel)
5. [Configuration des Variables d'Environnement](#configuration-des-variables-denvironnement)
6. [Vérification](#vérification)
7. [Dépannage](#dépannage)

---

## 🎯 Prérequis

### Compte Render.com
- Créez un compte sur [render.com](https://render.com)
- Connectez votre compte GitHub/GitLab

### Services Externes
- **MongoDB Atlas** (pour les bases de données en production)
- **Compte Gmail** (pour l'envoi d'emails)
- **Google OAuth** (pour l'authentification Google)
- **MinIO Cloud** ou **AWS S3** (pour le stockage de fichiers)

---

## 🔧 Préparation

### 1. Pousser le Code sur GitHub

```bash
# Initialiser git si ce n'est pas déjà fait
git init

# Ajouter tous les fichiers
git add .

# Commit
git commit -m "Prêt pour déploiement Render"

# Ajouter le remote
git remote add origin https://github.com/votre-username/mbolo-social-hub.git

# Pousser
git push -u origin main
```

### 2. Créer les Bases de Données MongoDB Atlas

1. Allez sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Créez un cluster gratuit
3. Créez 6 bases de données :
   - `mbolo_auth`
   - `mbolo_user`
   - `mbolo_chat`
   - `mbolo_post`
   - `mbolo_video`
   - `mbolo_moderation`
4. Notez les URI de connexion

### 3. Configurer Google OAuth

1. Allez sur [Google Cloud Console](https://console.cloud.google.com)
2. Créez un projet
3. Activez l'API Google+
4. Créez des identifiants OAuth 2.0
5. Ajoutez les URIs de redirection :
   - `https://mbolo-auth.onrender.com/api/auth/google/callback`
   - `http://localhost:8081/api/auth/google/callback` (pour dev)
6. Notez le Client ID et Client Secret

---

## 🚀 Déploiement Automatique (Recommandé)

### Option 1 : Utiliser render.yaml

1. **Connectez votre repo GitHub à Render**
   - Allez sur [Render Dashboard](https://dashboard.render.com)
   - Cliquez sur "New" → "Blueprint"
   - Sélectionnez votre repository
   - Render détectera automatiquement le fichier `render.yaml`

2. **Configurez les variables d'environnement**
   - Render vous demandera de configurer les variables marquées `sync: false`
   - Voir la section [Configuration des Variables](#configuration-des-variables-denvironnement)

3. **Déployez**
   - Cliquez sur "Apply"
   - Render créera automatiquement tous les services

---

## 🔨 Déploiement Manuel

### 1. Déployer le Frontend

1. **Créer un nouveau Web Service**
   - Dashboard → "New" → "Web Service"
   - Connectez votre repository
   - Nom : `mbolo-frontend`
   - Environment : `Docker`
   - Dockerfile Path : `./Dockerfile`
   - Plan : Free

2. **Variables d'environnement**
   ```
   NODE_ENV=production
   VITE_API_URL=https://mbolo-gateway.onrender.com
   VITE_WS_URL=wss://mbolo-gateway.onrender.com
   ```

3. **Déployer**

### 2. Déployer l'API Gateway

1. **Créer un nouveau Web Service**
   - Nom : `mbolo-gateway`
   - Environment : `Docker`
   - Dockerfile Path : `./backend/api-gateway/Dockerfile`
   - Docker Context : `./backend/api-gateway`

2. **Variables d'environnement**
   ```
   SPRING_PROFILES_ACTIVE=docker
   REDIS_HOST=<votre-redis-host>
   REDIS_PORT=6379
   ```

### 3. Déployer les Microservices

Répétez pour chaque service :
- `mbolo-auth` (port 8081)
- `mbolo-user` (port 8082)
- `mbolo-chat` (port 8083)
- `mbolo-post` (port 8084)
- `mbolo-video` (port 8085)
- `mbolo-moderation` (port 8086)

---

## 🔐 Configuration des Variables d'Environnement

### Frontend (mbolo-frontend)

```env
NODE_ENV=production
VITE_API_URL=https://mbolo-gateway.onrender.com
VITE_WS_URL=wss://mbolo-gateway.onrender.com
```

### API Gateway (mbolo-gateway)

```env
SPRING_PROFILES_ACTIVE=docker
REDIS_HOST=<redis-host-from-render>
REDIS_PORT=6379
```

### Auth Service (mbolo-auth)

```env
SPRING_PROFILES_ACTIVE=docker
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/mbolo_auth
MAIL_USERNAME=votre-email@gmail.com
MAIL_PASSWORD=votre-app-password
GOOGLE_CLIENT_ID=votre-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre-client-secret
GOOGLE_CALLBACK_URL=https://mbolo-auth.onrender.com/api/auth/google/callback
FRONTEND_URL=https://mbolo-frontend.onrender.com
REDIS_HOST=<redis-host>
JWT_SECRET=votre-secret-jwt-tres-long-et-securise
```

### User Service (mbolo-user)

```env
SPRING_PROFILES_ACTIVE=docker
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/mbolo_user
MINIO_ENDPOINT=https://votre-minio.com
MINIO_ACCESS_KEY=votre-access-key
MINIO_SECRET_KEY=votre-secret-key
```

### Chat Service (mbolo-chat)

```env
SPRING_PROFILES_ACTIVE=docker
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/mbolo_chat
REDIS_HOST=<redis-host>
```

### Post Service (mbolo-post)

```env
SPRING_PROFILES_ACTIVE=docker
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/mbolo_post
```

### Video Service (mbolo-video)

```env
SPRING_PROFILES_ACTIVE=docker
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/mbolo_video
MINIO_ENDPOINT=https://votre-minio.com
MINIO_ACCESS_KEY=votre-access-key
MINIO_SECRET_KEY=votre-secret-key
```

### Moderation Service (mbolo-moderation)

```env
SPRING_PROFILES_ACTIVE=docker
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/mbolo_moderation
```

---

## ✅ Vérification

### 1. Vérifier les Services

Chaque service devrait être accessible :

```bash
# Frontend
curl https://mbolo-frontend.onrender.com/health

# API Gateway
curl https://mbolo-gateway.onrender.com/actuator/health

# Auth Service
curl https://mbolo-auth.onrender.com/actuator/health

# User Service
curl https://mbolo-user.onrender.com/actuator/health

# Chat Service
curl https://mbolo-chat.onrender.com/actuator/health

# Post Service
curl https://mbolo-post.onrender.com/actuator/health

# Video Service
curl https://mbolo-video.onrender.com/actuator/health

# Moderation Service
curl https://mbolo-moderation.onrender.com/actuator/health
```

### 2. Tester l'Application

1. Ouvrez `https://mbolo-frontend.onrender.com`
2. Testez l'inscription
3. Testez la connexion
4. Testez les fonctionnalités principales

---

## 🔧 Dépannage

### Service ne démarre pas

1. **Vérifier les logs**
   - Dashboard → Service → Logs
   - Cherchez les erreurs

2. **Vérifier les variables d'environnement**
   - Assurez-vous que toutes les variables sont définies
   - Vérifiez les URI MongoDB

3. **Vérifier les health checks**
   - Les services Spring Boot doivent répondre sur `/actuator/health`

### Erreurs de connexion MongoDB

```
Error: MongoServerError: bad auth
```

**Solution** :
- Vérifiez l'URI MongoDB
- Assurez-vous que l'IP de Render est autorisée dans MongoDB Atlas (0.0.0.0/0)
- Vérifiez le username/password

### Erreurs CORS

```
Access to fetch at '...' from origin '...' has been blocked by CORS
```

**Solution** :
- Vérifiez que `FRONTEND_URL` est correctement configuré dans auth-service
- Vérifiez la configuration CORS dans l'API Gateway

### Service trop lent (Cold Start)

Les services gratuits Render s'endorment après 15 minutes d'inactivité.

**Solutions** :
1. Utilisez un plan payant
2. Utilisez un service de ping (UptimeRobot)
3. Acceptez le délai de démarrage (~30 secondes)

---

## 📊 Architecture de Déploiement

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Render.com (Frontend)                       │
│              mbolo-frontend.onrender.com                     │
│                    (Nginx + React)                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Render.com (API Gateway)                    │
│              mbolo-gateway.onrender.com                      │
│                   (Spring Cloud Gateway)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    ┌────────┐     ┌────────┐     ┌────────┐
    │  Auth  │     │  User  │     │  Chat  │
    │Service │     │Service │     │Service │
    └────────┘     └────────┘     └────────┘
         │               │               │
         ▼               ▼               ▼
    ┌────────────────────────────────────────┐
    │         MongoDB Atlas (Databases)       │
    └────────────────────────────────────────┘
```

---

## 💰 Coûts Estimés

### Plan Gratuit (Free Tier)
- **Frontend** : Gratuit (750h/mois)
- **Backend Services** : Gratuit (750h/mois par service)
- **MongoDB Atlas** : Gratuit (512MB)
- **Redis** : Gratuit (25MB)
- **Total** : 0€/mois

### Limitations du Plan Gratuit
- Services s'endorment après 15 min d'inactivité
- 750 heures/mois par service
- Bande passante limitée
- Pas de custom domain SSL

### Plan Payant (Recommandé pour Production)
- **Starter** : 7$/mois par service
- **Standard** : 25$/mois par service
- Pas de cold start
- Custom domains
- Plus de ressources

---

## 🎉 Félicitations !

Votre application MBolo Social Hub est maintenant déployée sur Render !

### Prochaines Étapes

1. ✅ Configurez un nom de domaine personnalisé
2. ✅ Activez SSL (automatique avec Render)
3. ✅ Configurez les sauvegardes MongoDB
4. ✅ Mettez en place un monitoring (UptimeRobot)
5. ✅ Configurez les alertes

---

## 📚 Ressources

- [Documentation Render](https://render.com/docs)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com)
- [Spring Boot on Render](https://render.com/docs/deploy-spring-boot)
- [React on Render](https://render.com/docs/deploy-create-react-app)

---

**Besoin d'aide ?** Consultez les logs dans le dashboard Render ou contactez le support.
