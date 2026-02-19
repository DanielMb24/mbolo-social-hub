# 🪟 Guide de Démarrage Rapide - Windows

## ⚡ Installation en 1 Commande

Ouvrez PowerShell dans le dossier du projet et exécutez:

```powershell
.\install.bat
```

**Note:** Sous PowerShell, vous devez utiliser `.\` devant les fichiers `.bat`

---

## 🚀 Commandes Essentielles

### Installation

```powershell
# Méthode 1: PowerShell (recommandé)
.\install.bat

# Méthode 2: CMD
cmd /c install.bat

# Méthode 3: Double-clic
# Faites un double-clic sur install.bat dans l'explorateur
```

### Démarrage

```powershell
# Backend + Frontend
.\start-all.bat

# Backend uniquement
cd backend
docker-compose up -d

# Frontend uniquement
npm run dev
```

### Vérification

```powershell
# Vérifier la santé des services
.\health-check.bat

# Vérifier les bases de données
cd backend
.\verify-databases.bat
```

### Arrêt

```powershell
cd backend
docker-compose down
```

---

## 🔧 Résolution de Problèmes PowerShell

### Erreur: "not recognized as a cmdlet"

**Problème:** PowerShell ne trouve pas le fichier

**Solution:** Utilisez `.\` devant le nom du fichier:
```powershell
.\install.bat          # ✅ Correct
install.bat            # ❌ Incorrect
```

### Erreur: "Execution Policy"

**Problème:** PowerShell bloque l'exécution de scripts

**Solution:** Exécutez en tant qu'administrateur:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Ou utilisez CMD à la place:
```powershell
cmd /c install.bat
```

### Erreur: "Docker not found"

**Problème:** Docker Desktop n'est pas installé ou démarré

**Solution:**
1. Installez Docker Desktop: https://www.docker.com/products/docker-desktop
2. Démarrez Docker Desktop
3. Attendez que Docker soit prêt (icône dans la barre des tâches)
4. Réessayez

---

## 📋 Checklist Avant Installation

- [ ] Docker Desktop installé et démarré
- [ ] Node.js 18+ installé
- [ ] PowerShell ou CMD ouvert dans le dossier du projet
- [ ] Connexion Internet active

---

## 🎯 Étapes d'Installation Détaillées

### 1. Ouvrir PowerShell

**Méthode A:** Depuis l'explorateur
1. Ouvrez le dossier du projet dans l'explorateur
2. Maintenez `Shift` + Clic droit dans le dossier
3. Sélectionnez "Ouvrir PowerShell ici"

**Méthode B:** Depuis le menu Démarrer
1. Recherchez "PowerShell"
2. Ouvrez PowerShell
3. Naviguez vers le dossier:
   ```powershell
   cd "C:\chemin\vers\mbolo-social-hub"
   ```

### 2. Lancer l'Installation

```powershell
.\install.bat
```

L'installation va:
- ✅ Vérifier Docker et Node.js
- ✅ Installer les dépendances npm
- ✅ Démarrer les conteneurs Docker
- ✅ Initialiser les bases de données
- ✅ Insérer des données de test

**Durée:** ~2-3 minutes

### 3. Démarrer le Frontend

Dans un nouveau terminal PowerShell:

```powershell
npm run dev
```

### 4. Accéder à l'Application

Ouvrez votre navigateur: **http://localhost:5173**

Connectez-vous avec:
- **Username:** testuser
- **Password:** test123

---

## 🔍 Vérification de l'Installation

### Vérifier Docker

```powershell
docker --version
docker ps
```

Vous devriez voir 14 conteneurs en cours d'exécution.

### Vérifier Node.js

```powershell
node --version
npm --version
```

### Vérifier les Services

```powershell
.\health-check.bat
```

Tous les services devraient être "OK" ou "Running".

---

## 🗄️ Base de Données

### Initialiser les Bases

```powershell
cd backend
.\init-databases.bat
```

### Insérer des Données de Test

```powershell
cd backend
.\seed-test-data.bat
```

**Identifiants créés:**
- Username: testuser
- Email: test@mbolo.com
- Password: test123

### Vérifier les Bases

```powershell
cd backend
.\verify-databases.bat
```

---

## 📊 Commandes Docker Utiles

### Voir les Conteneurs

```powershell
cd backend
docker-compose ps
```

### Voir les Logs

```powershell
cd backend
docker-compose logs -f
```

### Redémarrer un Service

```powershell
cd backend
docker-compose restart auth-service
```

### Arrêter Tout

```powershell
cd backend
docker-compose down
```

### Nettoyer Complètement

```powershell
cd backend
docker-compose down -v
docker system prune -a
```

---

## 🆘 Problèmes Courants

### Port Déjà Utilisé

**Symptôme:** Erreur "port is already allocated"

**Solution:**
```powershell
# Trouver le processus
netstat -ano | findstr :8080

# Tuer le processus (remplacez PID par le numéro trouvé)
taskkill /PID <PID> /F
```

### Docker ne Démarre Pas

**Solution:**
1. Ouvrez Docker Desktop
2. Attendez que l'icône soit verte
3. Réessayez

### Erreur "npm not found"

**Solution:**
1. Installez Node.js: https://nodejs.org/
2. Redémarrez PowerShell
3. Vérifiez: `node --version`

### Les Services ne Répondent Pas

**Solution:**
```powershell
cd backend
docker-compose down
docker-compose up -d
timeout /t 30
.\init-databases.bat
```

---

## 💡 Astuces Windows

### Utiliser CMD au lieu de PowerShell

Si vous préférez CMD:

```cmd
cd C:\chemin\vers\mbolo-social-hub
install.bat
```

### Créer un Raccourci

1. Clic droit sur `install.bat`
2. "Créer un raccourci"
3. Placez le raccourci sur le bureau
4. Double-cliquez pour installer

### Ouvrir Plusieurs Terminaux

Pour le développement, ouvrez 2 terminaux:

**Terminal 1:** Backend (déjà démarré par install.bat)
**Terminal 2:** Frontend
```powershell
npm run dev
```

---

## 📚 Documentation Complète

- [Guide de Démarrage Rapide](./QUICK_START.md)
- [README Principal](./README.md)
- [Aide-Mémoire des Commandes](./COMMANDS_CHEATSHEET.md)
- [Documentation Index](./DOCUMENTATION_INDEX.md)

---

## 🎉 C'est Parti!

Vous êtes maintenant prêt à utiliser MBolo!

```powershell
# Installation
.\install.bat

# Démarrage
npm run dev

# Accès
# http://localhost:5173
```

**Identifiants de test:** testuser / test123

**Bon développement! 🚀**
