# 🚀 Déploiement Rapide sur Render.com

## ⚡ Démarrage en 5 Minutes

### 1️⃣ Prérequis (2 min)

- ✅ Compte [Render.com](https://render.com) (gratuit)
- ✅ Compte [GitHub](https://github.com) 
- ✅ Compte [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (gratuit)

### 2️⃣ Préparation (1 min)

```bash
# Cloner ou pousser votre code sur GitHub
git add .
git commit -m "Prêt pour déploiement"
git push origin main
```

### 3️⃣ Déploiement (2 min)

1. **Allez sur [Render Dashboard](https://dashboard.render.com)**

2. **Cliquez sur "New" → "Blueprint"**

3. **Connectez votre repository GitHub**
   - Sélectionnez `mbolo-social-hub`
   - Render détecte automatiquement `render.yaml`

4. **Configurez les variables d'environnement** (obligatoires) :
   ```
   MAIL_USERNAME=votre-email@gmail.com
   MAIL_PASSWORD=votre-app-password
   GOOGLE_CLIENT_ID=votre-client-id
   GOOGLE_CLIENT_SECRET=votre-secret
   MINIO_ACCESS_KEY=votre-access-key
   MINIO_SECRET_KEY=votre-secret-key
   JWT_SECRET=un-secret-tres-long-et-securise
   ```

5. **Cliquez sur "Apply"**

6. **Attendez 5-10 minutes** ⏳

7. **C'est prêt !** 🎉

---

## 🔑 Obtenir les Credentials

### Gmail App Password

1. Allez sur [Google Account Security](https://myaccount.google.com/security)
2. Activez la validation en 2 étapes
3. Allez dans "Mots de passe des applications"
4. Créez un mot de passe pour "Mail"
5. Copiez le mot de passe généré

### Google OAuth

1. Allez sur [Google Cloud Console](https://console.cloud.google.com)
2. Créez un projet
3. Activez "Google+ API"
4. Créez des identifiants OAuth 2.0
5. Ajoutez l'URI de redirection :
   ```
   https://mbolo-auth.onrender.com/api/auth/google/callback
   ```
6. Copiez Client ID et Client Secret

### MongoDB Atlas

1. Allez sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Créez un cluster gratuit (M0)
3. Créez un utilisateur de base de données
4. Autorisez toutes les IPs (0.0.0.0/0)
5. Copiez l'URI de connexion :
   ```
   mongodb+srv://username:password@cluster.mongodb.net/
   ```

### MinIO / S3

**Option 1 : MinIO Cloud**
1. Allez sur [min.io](https://min.io)
2. Créez un compte
3. Créez un bucket
4. Générez des access keys

**Option 2 : AWS S3**
1. Allez sur [AWS Console](https://console.aws.amazon.com)
2. Créez un bucket S3
3. Créez un utilisateur IAM avec accès S3
4. Générez des access keys

---

## 📋 Checklist de Déploiement

- [ ] Code poussé sur GitHub
- [ ] Compte Render créé
- [ ] MongoDB Atlas configuré (6 bases de données)
- [ ] Gmail App Password obtenu
- [ ] Google OAuth configuré
- [ ] MinIO/S3 configuré
- [ ] Blueprint Render créé
- [ ] Variables d'environnement configurées
- [ ] Services déployés (8 services)
- [ ] Tests effectués

---

## ✅ Vérification

### Tester les Services

```bash
# Windows
verify-deployment.bat

# Linux/Mac
chmod +x verify-deployment.sh
./verify-deployment.sh
```

### Tester l'Application

1. Ouvrez `https://mbolo-frontend.onrender.com`
2. Créez un compte
3. Connectez-vous
4. Testez les fonctionnalités

---

## 🐛 Problèmes Courants

### Service ne démarre pas

**Symptôme** : Service en erreur dans Render

**Solution** :
1. Vérifiez les logs dans Render Dashboard
2. Vérifiez les variables d'environnement
3. Vérifiez que MongoDB Atlas autorise les connexions (0.0.0.0/0)

### Erreur 502 Bad Gateway

**Symptôme** : Erreur 502 lors de l'accès à l'application

**Solution** :
1. Attendez 30 secondes (cold start)
2. Vérifiez que tous les services sont "Live"
3. Vérifiez les health checks

### Erreur CORS

**Symptôme** : Erreurs CORS dans la console du navigateur

**Solution** :
1. Vérifiez `FRONTEND_URL` dans auth-service
2. Vérifiez la configuration CORS dans api-gateway
3. Redéployez les services

---

## 💰 Coûts

### Plan Gratuit
- ✅ 8 services web gratuits
- ✅ MongoDB Atlas gratuit (512MB)
- ✅ Redis gratuit (25MB)
- ⚠️ Services s'endorment après 15 min
- ⚠️ 750h/mois par service

### Plan Payant (7$/mois par service)
- ✅ Pas de cold start
- ✅ Custom domains
- ✅ Plus de ressources
- ✅ Support prioritaire

**Total pour 8 services** : 56$/mois

---

## 🎯 URLs de Production

Après déploiement, vos services seront disponibles sur :

- **Frontend** : `https://mbolo-frontend.onrender.com`
- **API Gateway** : `https://mbolo-gateway.onrender.com`
- **Auth Service** : `https://mbolo-auth.onrender.com`
- **User Service** : `https://mbolo-user.onrender.com`
- **Chat Service** : `https://mbolo-chat.onrender.com`
- **Post Service** : `https://mbolo-post.onrender.com`
- **Video Service** : `https://mbolo-video.onrender.com`
- **Moderation Service** : `https://mbolo-moderation.onrender.com`

---

## 📚 Documentation Complète

Pour plus de détails, consultez :
- [GUIDE_DEPLOIEMENT_RENDER.md](./GUIDE_DEPLOIEMENT_RENDER.md) - Guide complet
- [render.yaml](./render.yaml) - Configuration Blueprint
- [Dockerfile](./Dockerfile) - Configuration Docker frontend

---

## 🆘 Besoin d'Aide ?

1. Consultez les logs dans Render Dashboard
2. Vérifiez [Render Docs](https://render.com/docs)
3. Vérifiez [MongoDB Atlas Docs](https://docs.atlas.mongodb.com)
4. Contactez le support Render

---

**Bon déploiement ! 🚀**
