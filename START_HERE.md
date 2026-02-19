# 🎉 Bienvenue sur MBolo!

## 👋 Commencez ici

Vous êtes sur le point de lancer une plateforme sociale complète avec microservices!

## ⚡ Démarrage Ultra-Rapide (2 minutes)

### Étape 1: Installation

**Windows (PowerShell):**
```powershell
.\install.bat
```

**Ou double-cliquez sur:** `RUN_ME_FIRST.bat`

**Linux/Mac:**
```bash
chmod +x setup-permissions.sh
./setup-permissions.sh
./install.sh
```

### Étape 2: Démarrage

```bash
npm run dev
```

### Étape 3: Accès

Ouvrez votre navigateur: **http://localhost:5173**

---

## 📚 Documentation

### 🎯 Guides Essentiels

| Guide | Description | Quand l'utiliser |
|-------|-------------|------------------|
| **[QUICK_START.md](./QUICK_START.md)** | Démarrage rapide | Première utilisation |
| **[README.md](./README.md)** | Documentation complète | Comprendre le projet |
| **[COMMANDS_CHEATSHEET.md](./COMMANDS_CHEATSHEET.md)** | Toutes les commandes | Référence quotidienne |
| **[DEPLOYMENT.md](./DEPLOYMENT.md)** | Guide de déploiement | Installation détaillée |

### 📖 Documentation Complète

Consultez **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** pour naviguer dans toute la documentation.

---

## 🎯 Que Faire Ensuite?

### ✅ Vérifier que tout fonctionne

```bash
./health-check.sh    # Linux/Mac
health-check.bat     # Windows
```

### ✅ Explorer l'application

1. Créez un compte sur http://localhost:5173
2. Créez une publication
3. Uploadez une vidéo
4. Envoyez un message
5. Modifiez votre profil

### ✅ Consulter les outils

- **MinIO Console:** http://localhost:9001
  - Username: `mbolo_admin`
  - Password: `mbolo_secret_2025`

- **API Gateway:** http://localhost:8080

---

## 🆘 Besoin d'Aide?

### Problèmes Courants

**Le backend ne démarre pas:**
```bash
cd backend
docker-compose down -v
docker-compose up -d --build
```

**Port déjà utilisé:**
- Vérifiez qu'aucun autre service n'utilise les ports 5173, 8080-8086

**Erreur de connexion:**
- Attendez 30 secondes après le démarrage
- Exécutez `./health-check.sh` ou `health-check.bat`

### Documentation Détaillée

- [Guide de Démarrage Rapide](./QUICK_START.md) - Section "Problèmes Courants"
- [Aide-Mémoire des Commandes](./COMMANDS_CHEATSHEET.md) - Section "Dépannage"

---

## 🎓 Parcours Recommandé

### Jour 1: Découverte
1. ✅ Installer l'application (ce guide)
2. ✅ Lire [QUICK_START.md](./QUICK_START.md)
3. ✅ Tester les fonctionnalités
4. ✅ Consulter [COMMANDS_CHEATSHEET.md](./COMMANDS_CHEATSHEET.md)

### Jour 2: Compréhension
1. ✅ Lire [README.md](./README.md)
2. ✅ Explorer [PROJECT_STATUS.md](./PROJECT_STATUS.md)
3. ✅ Comprendre l'architecture

### Jour 3: Développement
1. ✅ Lire [CONTRIBUTING.md](./CONTRIBUTING.md)
2. ✅ Faire une première contribution
3. ✅ Consulter le code source

---

## 🚀 Commandes Essentielles

### Démarrage
```bash
# Backend
cd backend && docker-compose up -d

# Frontend
npm run dev

# Tout en une fois
./start-all.sh    # Linux/Mac
start-all.bat     # Windows
```

### Vérification
```bash
# Santé des services
./health-check.sh    # Linux/Mac
health-check.bat     # Windows

# Logs
cd backend && docker-compose logs -f
```

### Arrêt
```bash
cd backend && docker-compose down
```

---

## 📊 Ce qui est Inclus

### ✅ Backend (7 Microservices)
- API Gateway (port 8080)
- Auth Service (JWT)
- User Service (profils)
- Chat Service (WebSocket)
- Post Service (publications)
- Video Service (vidéos)
- Moderation Service (modération)

### ✅ Infrastructure
- 6 bases MongoDB
- Redis (cache)
- MinIO (stockage S3)
- Docker Compose

### ✅ Frontend
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- Client API complet
- WebSocket chat temps réel

### ✅ Outils
- Scripts d'installation
- Scripts de santé
- Makefile (Linux/Mac)
- Documentation complète

---

## 🎉 Félicitations!

Vous avez maintenant une plateforme sociale complète et fonctionnelle!

### Prochaines Étapes

1. **Explorez:** Testez toutes les fonctionnalités
2. **Apprenez:** Lisez la documentation
3. **Contribuez:** Ajoutez vos propres fonctionnalités
4. **Partagez:** Montrez votre projet!

---

## 📞 Support

- **Documentation:** [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)
- **Commandes:** [COMMANDS_CHEATSHEET.md](./COMMANDS_CHEATSHEET.md)
- **Issues:** Ouvrez une issue sur GitHub
- **Contribution:** [CONTRIBUTING.md](./CONTRIBUTING.md)

---

## 🌟 Fonctionnalités Principales

- ✅ Authentification JWT sécurisée
- ✅ Profils utilisateurs avec avatars
- ✅ Publications avec images
- ✅ Vidéos avec upload
- ✅ Chat temps réel
- ✅ Système de likes et commentaires
- ✅ Modération de contenu
- ✅ Recherche d'utilisateurs
- ✅ Follow/Unfollow

---

**💡 Astuce:** Gardez ce fichier ouvert pendant votre première utilisation!

**🚀 Prêt?** Lancez `npm run dev` et ouvrez http://localhost:5173

**Bon développement! 🎊**
