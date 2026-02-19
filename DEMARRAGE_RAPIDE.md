# 🚀 Démarrage Rapide - MBolo

## En 3 Étapes Simples

### Étape 1: Démarrer le Backend
```bash
cd backend
docker-compose up -d
```
⏱️ Attends 30 secondes que tous les services démarrent

### Étape 2: Démarrer le Frontend
```bash
# Dans un nouveau terminal, à la racine du projet
npm run dev
```

### Étape 3: Ouvrir l'Application
Ouvre ton navigateur sur: **http://localhost:5174**

---

## ✅ Vérification Rapide

### Tous les services sont-ils actifs?
```bash
cd backend
docker-compose ps
```
Tu dois voir tous les services avec status "Up" et "(healthy)"

### Le frontend fonctionne-t-il?
Ouvre http://localhost:5174 - tu dois voir la page de connexion

---

## 🎮 Utilisation

### 1. Créer un Compte
- Clique sur "S'inscrire"
- Remplis: username, email, mot de passe
- Clique "S'inscrire"

### 2. Créer un Post
- Dans le fil d'actualité, écris ton message
- Ajoute des hashtags avec #
- Clique "Publier"

### 3. Suivre des Utilisateurs
- Va dans l'onglet "Personnes" 👥
- Clique "Suivre" sur les utilisateurs
- Vois les compteurs se mettre à jour

### 4. Voir les Tendances
- Regarde la sidebar à droite
- Clique sur les hashtags tendances
- Découvre les suggestions d'utilisateurs

### 5. Commenter
- Clique sur un post
- Écris ton commentaire
- Réponds aux autres avec @username

---

## 🛑 Arrêter l'Application

### Arrêter le Frontend
Dans le terminal du frontend: `Ctrl + C`

### Arrêter le Backend
```bash
cd backend
docker-compose down
```

---

## 🔧 En Cas de Problème

### Le frontend ne démarre pas?
```bash
npm install
npm run dev
```

### Les services backend ne démarrent pas?
```bash
cd backend
docker-compose down
docker-compose up -d
```

### Erreur 404 sur les endpoints?
```bash
cd backend
docker-compose restart api-gateway
docker-compose restart user-service
```

### Rebuild complet du user-service?
```bash
cd backend
.\rebuild-user-service-no-cache.bat
```

---

## 📱 Ports Utilisés

- **Frontend**: 5174
- **API Gateway**: 8080
- **Auth Service**: 8081
- **User Service**: 8082
- **Chat Service**: 8083
- **Post Service**: 8084
- **Video Service**: 8085
- **Moderation Service**: 8086
- **MongoDB**: 27017-27022
- **Redis**: 6379
- **MinIO**: 9000-9001

---

## 💡 Astuces

### Voir les logs d'un service
```bash
cd backend
docker-compose logs -f user-service
```

### Voir tous les logs
```bash
cd backend
docker-compose logs -f
```

### Redémarrer un service spécifique
```bash
cd backend
docker-compose restart user-service
```

### Vérifier la santé des services
```bash
cd backend
docker-compose ps
```

---

## 🎯 Fonctionnalités Principales

✅ **Authentification** - Inscription/Connexion sécurisée
✅ **Profil** - Modifier tes infos, voir tes stats
✅ **Posts** - Créer, liker, commenter
✅ **Follow** - Suivre d'autres utilisateurs
✅ **Tendances** - Voir les hashtags populaires
✅ **Découverte** - Trouver de nouveaux utilisateurs
✅ **Commentaires** - Threads de discussion
✅ **Responsive** - Fonctionne sur mobile et desktop

---

## 📚 Documentation Complète

Pour plus de détails, consulte:
- `SYSTEME_COMPLET_OPERATIONNEL.md` - Vue d'ensemble complète
- `FOLLOW_SYSTEM_DEPLOYED.md` - Détails du système de suivi
- `README.md` - Documentation générale

---

**C'est tout! Profite de ton réseau social MBolo! 🎉**
