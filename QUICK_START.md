# 🚀 Guide de Démarrage Rapide - MBolo

## Installation en 3 étapes

### 1️⃣ Installation Automatique

**Windows:**
```bash
install.bat
```

**Linux/Mac:**
```bash
chmod +x install.sh
./install.sh
```

### 2️⃣ Démarrer le Frontend

```bash
npm run dev
```

### 3️⃣ Accéder à l'Application

Ouvrez votre navigateur: **http://localhost:5173**

---

## 📋 Commandes Essentielles

### Avec Make (Linux/Mac)

```bash
make help          # Voir toutes les commandes
make dev           # Démarrer tout (backend + init)
make frontend      # Démarrer le frontend
make health        # Vérifier la santé des services
make logs          # Voir les logs
make stop          # Arrêter tout
```

### Sans Make (Windows/Linux/Mac)

```bash
# Démarrer le backend
cd backend
docker-compose up -d

# Voir les logs
cd backend
docker-compose logs -f

# Arrêter
cd backend
docker-compose down

# Démarrer le frontend
npm run dev
```

---

## 🔍 Vérifier que tout fonctionne

### Option 1: Script automatique

**Windows:**
```bash
health-check.bat
```

**Linux/Mac:**
```bash
chmod +x health-check.sh
./health-check.sh
```

### Option 2: Manuellement

Vérifiez ces URLs dans votre navigateur:

- ✅ Frontend: http://localhost:5173
- ✅ API Gateway: http://localhost:8080/actuator/health
- ✅ MinIO Console: http://localhost:9001

---

## 🎯 Premiers Pas

## 🎯 Premiers Pas

### 1. Créer un compte

Deux options:

**Option A: Utiliser le compte de test**
- Username: `testuser`
- Email: `test@mbolo.com`
- Password: `test123`

**Option B: Créer votre propre compte**
1. Allez sur http://localhost:5173
2. Cliquez sur "S'inscrire"
3. Remplissez le formulaire

### 2. Se connecter

Utilisez les identifiants que vous venez de créer.

### 3. Explorer l'application

- 📝 Créer des publications
- 🎥 Uploader des vidéos
- 💬 Envoyer des messages
- 👤 Modifier votre profil

---

## 🐛 Problèmes Courants

### Le backend ne démarre pas

```bash
cd backend
docker-compose down -v
docker-compose up -d --build
```

### Port déjà utilisé

Vérifiez qu'aucun autre service n'utilise ces ports:
- 5173 (Frontend)
- 8080-8086 (Backend services)
- 27017-27022 (MongoDB)
- 6379 (Redis)
- 9000-9001 (MinIO)

### Erreur de connexion à la base de données

Attendez 30 secondes après le démarrage, puis:

```bash
cd backend
./init-databases.sh  # Linux/Mac
init-databases.bat   # Windows
```

---

## 📚 Documentation Complète

- [README Principal](./README.md)
- [Guide de Déploiement](./DEPLOYMENT.md)
- [Documentation Backend](./backend/DEPLOYMENT.md)

---

## 🆘 Besoin d'Aide?

1. Vérifiez les logs: `cd backend && docker-compose logs -f`
2. Vérifiez la santé: `./health-check.sh` ou `health-check.bat`
3. Consultez la documentation complète
4. Ouvrez une issue sur GitHub

---

## 🎉 C'est Parti!

Votre plateforme MBolo est maintenant prête à l'emploi!

```bash
npm run dev
```

Puis ouvrez: **http://localhost:5173**
