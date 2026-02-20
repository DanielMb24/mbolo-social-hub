# 🔐 Guide des Variables d'Environnement

## 📋 Fichiers Créés

1. **`.env.render`** - Fichier complet avec toutes les variables
2. **`.env.render.minimal`** - Version minimale (variables essentielles uniquement)
3. **`generate-jwt-secret.sh`** - Script pour générer un JWT secret (Linux/Mac)
4. **`generate-jwt-secret.bat`** - Script pour générer un JWT secret (Windows)

---

## 🚀 Démarrage Rapide

### 1. Générer un JWT Secret

**Windows :**
```bash
generate-jwt-secret.bat
```

**Linux/Mac :**
```bash
chmod +x generate-jwt-secret.sh
./generate-jwt-secret.sh
```

Copiez le secret généré, vous en aurez besoin.

### 2. Préparer vos Credentials

Avant de configurer Render, obtenez :

#### Gmail App Password
1. Allez sur https://myaccount.google.com/security
2. Activez la validation en 2 étapes
3. Allez dans "Mots de passe des applications"
4. Créez un mot de passe pour "Mail"
5. Copiez le mot de passe généré (16 caractères)

#### Google OAuth
1. Allez sur https://console.cloud.google.com
2. Créez un projet
3. Activez "Google+ API"
4. Créez des identifiants OAuth 2.0
5. Ajoutez l'URI de redirection :
   ```
   https://mbolo-auth.onrender.com/api/auth/google/callback
   ```
6. Copiez Client ID et Client Secret

#### MongoDB Atlas
1. Allez sur https://www.mongodb.com/cloud/atlas
2. Créez un cluster gratuit (M0)
3. Créez un utilisateur de base de données
4. Dans "Network Access", autorisez toutes les IPs : `0.0.0.0/0`
5. Copiez l'URI de connexion :
   ```
   mongodb+srv://username:password@cluster.mongodb.net/
   ```
6. Créez 6 bases de données :
   - `mbolo_auth`
   - `mbolo_user`
   - `mbolo_chat`
   - `mbolo_post`
   - `mbolo_video`
   - `mbolo_moderation`

#### MinIO / S3
**Option 1 : MinIO Cloud**
1. Allez sur https://min.io
2. Créez un compte
3. Créez un bucket : `mbolo-uploads`
4. Générez des access keys

**Option 2 : AWS S3**
1. Allez sur https://console.aws.amazon.com
2. Créez un bucket S3
3. Créez un utilisateur IAM avec accès S3
4. Générez des access keys

---

## 📝 Configuration dans Render

### Méthode 1 : Via le Dashboard (Recommandé)

1. **Allez sur Render Dashboard**
   - https://dashboard.render.com

2. **Créez un Blueprint**
   - Cliquez "New" → "Blueprint"
   - Sélectionnez votre repository GitHub
   - Render détecte automatiquement `render.yaml`

3. **Configurez les Variables**
   
   Render vous demandera de configurer ces variables :

   #### Variables Globales (pour tous les services)
   ```
   JWT_SECRET=<votre-secret-genere>
   ```

   #### Auth Service
   ```
   MAIL_USERNAME=votre-email@gmail.com
   MAIL_PASSWORD=votre-app-password-16-caracteres
   GOOGLE_CLIENT_ID=votre-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=votre-client-secret
   ```

   #### Services avec MongoDB
   ```
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/mbolo_auth
   ```
   (Répétez pour chaque service avec le bon nom de base)

   #### Services avec MinIO/S3
   ```
   MINIO_ENDPOINT=https://your-minio-endpoint.com
   MINIO_ACCESS_KEY=votre-access-key
   MINIO_SECRET_KEY=votre-secret-key
   ```

4. **Cliquez sur "Apply"**

### Méthode 2 : Via le Fichier .env

1. **Ouvrez `.env.render.minimal`**

2. **Remplissez toutes les valeurs**

3. **Pour chaque service dans Render :**
   - Allez dans "Environment"
   - Cliquez "Add Environment Variable"
   - Copiez-collez les variables du fichier

---

## 🔑 Variables par Service

### Frontend (mbolo-frontend)

```env
NODE_ENV=production
VITE_API_URL=https://mbolo-gateway.onrender.com
VITE_WS_URL=wss://mbolo-gateway.onrender.com
```

### API Gateway (mbolo-gateway)

```env
SPRING_PROFILES_ACTIVE=docker
JWT_SECRET=<votre-secret>
REDIS_HOST=<auto-genere-par-render>
REDIS_PORT=6379
```

### Auth Service (mbolo-auth)

```env
SPRING_PROFILES_ACTIVE=docker
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/mbolo_auth
JWT_SECRET=<votre-secret>
MAIL_USERNAME=votre-email@gmail.com
MAIL_PASSWORD=votre-app-password
GOOGLE_CLIENT_ID=votre-client-id
GOOGLE_CLIENT_SECRET=votre-client-secret
GOOGLE_CALLBACK_URL=https://mbolo-auth.onrender.com/api/auth/google/callback
FRONTEND_URL=https://mbolo-frontend.onrender.com
REDIS_HOST=<auto-genere-par-render>
```

### User Service (mbolo-user)

```env
SPRING_PROFILES_ACTIVE=docker
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/mbolo_user
MINIO_ENDPOINT=https://your-minio-endpoint.com
MINIO_ACCESS_KEY=votre-access-key
MINIO_SECRET_KEY=votre-secret-key
```

### Chat Service (mbolo-chat)

```env
SPRING_PROFILES_ACTIVE=docker
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/mbolo_chat
REDIS_HOST=<auto-genere-par-render>
```

### Post Service (mbolo-post)

```env
SPRING_PROFILES_ACTIVE=docker
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/mbolo_post
```

### Video Service (mbolo-video)

```env
SPRING_PROFILES_ACTIVE=docker
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/mbolo_video
MINIO_ENDPOINT=https://your-minio-endpoint.com
MINIO_ACCESS_KEY=votre-access-key
MINIO_SECRET_KEY=votre-secret-key
```

### Moderation Service (mbolo-moderation)

```env
SPRING_PROFILES_ACTIVE=docker
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/mbolo_moderation
```

---

## ✅ Checklist de Configuration

### Avant de Déployer
- [ ] JWT Secret généré
- [ ] Gmail App Password obtenu
- [ ] Google OAuth configuré (Client ID + Secret)
- [ ] MongoDB Atlas configuré (6 bases)
- [ ] MongoDB Atlas : IP 0.0.0.0/0 autorisée
- [ ] MinIO/S3 configuré (Access Keys)
- [ ] Fichier `.env.render.minimal` rempli

### Pendant la Configuration
- [ ] Variables copiées dans Render Dashboard
- [ ] JWT_SECRET identique pour gateway et auth
- [ ] URLs de callback correctes
- [ ] MongoDB URIs correctes (avec nom de base)
- [ ] Credentials testés

### Après la Configuration
- [ ] Tous les services démarrent
- [ ] Health checks passent
- [ ] Logs sans erreur
- [ ] Tests fonctionnels OK

---

## 🔒 Sécurité

### Bonnes Pratiques

1. **Ne commitez JAMAIS les fichiers .env avec les vraies valeurs**
   ```bash
   # Ajoutez à .gitignore
   .env.render
   .env.render.minimal
   .env.production
   ```

2. **Utilisez des secrets forts**
   - JWT Secret : minimum 256 bits (32 caractères)
   - Mots de passe : minimum 16 caractères
   - Changez les secrets régulièrement

3. **Activez l'authentification 2FA**
   - Sur Render.com
   - Sur MongoDB Atlas
   - Sur Google Cloud Console
   - Sur votre compte Gmail

4. **Limitez les accès**
   - MongoDB Atlas : autorisez uniquement les IPs nécessaires en production
   - MinIO/S3 : utilisez des policies restrictives
   - Render : utilisez des secrets, pas des variables d'environnement publiques

5. **Surveillez les logs**
   - Activez les alertes sur Render
   - Surveillez les tentatives de connexion
   - Vérifiez régulièrement les accès

---

## 🐛 Dépannage

### Erreur : "Invalid JWT Secret"

**Cause** : JWT_SECRET différent entre gateway et auth-service

**Solution** :
1. Générez un nouveau secret avec `generate-jwt-secret.bat`
2. Utilisez le MÊME secret pour :
   - `GATEWAY_JWT_SECRET`
   - `AUTH_JWT_SECRET`
3. Redéployez les services

### Erreur : "MongoDB connection failed"

**Cause** : URI MongoDB incorrecte ou IP non autorisée

**Solution** :
1. Vérifiez l'URI MongoDB (username, password, cluster)
2. Dans MongoDB Atlas → Network Access → Autorisez `0.0.0.0/0`
3. Vérifiez que la base de données existe
4. Testez la connexion avec MongoDB Compass

### Erreur : "Email sending failed"

**Cause** : Credentials Gmail incorrects

**Solution** :
1. Vérifiez que vous utilisez un "App Password", pas votre mot de passe Gmail
2. Vérifiez que la validation en 2 étapes est activée
3. Générez un nouveau App Password si nécessaire
4. Vérifiez `MAIL_USERNAME` et `MAIL_PASSWORD`

### Erreur : "Google OAuth failed"

**Cause** : Configuration OAuth incorrecte

**Solution** :
1. Vérifiez `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET`
2. Dans Google Cloud Console → Credentials → OAuth 2.0
3. Vérifiez que l'URI de redirection est correcte :
   ```
   https://mbolo-auth.onrender.com/api/auth/google/callback
   ```
4. Vérifiez que l'API Google+ est activée

### Erreur : "MinIO connection failed"

**Cause** : Credentials MinIO/S3 incorrects

**Solution** :
1. Vérifiez `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`
2. Vérifiez que le bucket existe
3. Vérifiez les permissions du bucket
4. Testez avec MinIO Client (mc) ou AWS CLI

---

## 📚 Ressources

- [Render Environment Variables](https://render.com/docs/environment-variables)
- [MongoDB Atlas Connection Strings](https://docs.atlas.mongodb.com/driver-connection/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [MinIO Documentation](https://docs.min.io/)

---

## 🎉 Félicitations !

Une fois toutes les variables configurées, vos services démarreront automatiquement sur Render.

Vérifiez le déploiement avec :
```bash
verify-deployment.bat  # Windows
./verify-deployment.sh # Linux/Mac
```

---

**Bon déploiement ! 🚀**
