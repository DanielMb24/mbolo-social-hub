# 📋 MBolo - Aide-Mémoire des Commandes

## 🚀 Installation & Démarrage

### Installation Complète

**Windows:**
```bash
install.bat
```

**Linux/Mac:**
```bash
chmod +x setup-permissions.sh
./setup-permissions.sh
./install.sh
```

### Démarrage Rapide

```bash
# Backend + Frontend
./start-all.sh          # Linux/Mac
start-all.bat           # Windows

# Backend uniquement
cd backend && docker-compose up -d

# Frontend uniquement
npm run dev
```

---

## 🐳 Docker & Backend

### Gestion des Services

```bash
cd backend

# Démarrer tous les services
docker-compose up -d

# Démarrer en mode verbose (voir les logs)
docker-compose up

# Arrêter tous les services
docker-compose down

# Arrêter et supprimer les volumes (⚠️ supprime les données)
docker-compose down -v

# Redémarrer tous les services
docker-compose restart

# Redémarrer un service spécifique
docker-compose restart auth-service

# Rebuild et redémarrer
docker-compose up -d --build

# Rebuild un service spécifique
docker-compose up -d --build auth-service
```

### Logs

```bash
cd backend

# Voir tous les logs
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f auth-service

# Dernières 100 lignes
docker-compose logs --tail=100 auth-service

# Logs depuis 10 minutes
docker-compose logs --since 10m
```

### Statut & Santé

```bash
cd backend

# Voir le statut de tous les conteneurs
docker-compose ps

# Voir les ressources utilisées
docker stats

# Vérifier la santé (script personnalisé)
cd .. && ./health-check.sh    # Linux/Mac
cd .. && health-check.bat      # Windows
```

---

## 💻 Frontend

### Développement

```bash
# Démarrer le serveur de dev
npm run dev

# Build pour production
npm run build

# Preview du build production
npm run preview

# Linter
npm run lint

# Tests
npm run test

# Tests en mode watch
npm run test:watch
```

### Dépendances

```bash
# Installer les dépendances
npm install

# Ajouter une dépendance
npm install [package-name]

# Ajouter une dépendance de dev
npm install -D [package-name]

# Mettre à jour les dépendances
npm update

# Vérifier les dépendances obsolètes
npm outdated
```

---

## 🗄️ Base de Données

### Initialisation

```bash
cd backend

# Initialiser les bases de données
./init-databases.sh     # Linux/Mac
init-databases.bat      # Windows

# Initialiser MinIO
./init-minio.sh         # Linux/Mac
init-minio.bat          # Windows
```

### MongoDB

```bash
# Se connecter à MongoDB Auth
docker exec -it mbolo-mongo-auth mongosh

# Se connecter à une base spécifique
docker exec -it mbolo-mongo-auth mongosh mbolo_auth

# Lister les bases de données
docker exec -it mbolo-mongo-auth mongosh --eval "show dbs"

# Voir les collections
docker exec -it mbolo-mongo-auth mongosh mbolo_auth --eval "show collections"

# Compter les documents
docker exec -it mbolo-mongo-auth mongosh mbolo_auth --eval "db.users_auth.countDocuments()"

# Voir les utilisateurs
docker exec -it mbolo-mongo-auth mongosh mbolo_auth --eval "db.users_auth.find().pretty()"
```

### Redis

```bash
# Se connecter à Redis
docker exec -it mbolo-redis redis-cli

# Voir toutes les clés
docker exec -it mbolo-redis redis-cli KEYS "*"

# Voir une valeur
docker exec -it mbolo-redis redis-cli GET [key]

# Vider Redis
docker exec -it mbolo-redis redis-cli FLUSHALL
```

### MinIO

```bash
# Accéder à la console MinIO
# URL: http://localhost:9001
# Username: mbolo_admin
# Password: mbolo_secret_2025

# Lister les buckets
docker exec mbolo-minio mc ls mbolo

# Voir le contenu d'un bucket
docker exec mbolo-minio mc ls mbolo/mbolo-avatars
```

---

## 🔧 Make (Linux/Mac uniquement)

```bash
# Voir toutes les commandes
make help

# Installation
make install

# Démarrer le backend
make start

# Arrêter le backend
make stop

# Redémarrer
make restart

# Voir les logs
make logs

# Vérifier la santé
make health

# Nettoyer (⚠️ supprime les données)
make clean

# Rebuild
make build

# Initialiser DB
make init-db

# Initialiser MinIO
make init-minio

# Mode développement complet
make dev

# Tests
make test

# Linter
make lint

# Démarrer le frontend
make frontend

# Voir le statut
make status
```

---

## 🔍 Debugging

### Vérifier les Ports

```bash
# Windows
netstat -ano | findstr :8080

# Linux/Mac
lsof -i :8080
netstat -tuln | grep 8080
```

### Vérifier les Services

```bash
# API Gateway
curl http://localhost:8080/actuator/health

# Auth Service
curl http://localhost:8081/actuator/health

# User Service
curl http://localhost:8082/actuator/health

# Tous les services
./health-check.sh    # Linux/Mac
health-check.bat     # Windows
```

### Logs Détaillés

```bash
cd backend

# Logs d'un service avec timestamps
docker-compose logs -f --timestamps auth-service

# Logs depuis une date
docker-compose logs --since 2024-01-01T00:00:00

# Logs jusqu'à une date
docker-compose logs --until 2024-01-01T23:59:59
```

---

## 🧹 Nettoyage

### Nettoyage Léger

```bash
cd backend

# Arrêter les services
docker-compose down

# Supprimer les images non utilisées
docker image prune -a

# Supprimer les volumes non utilisés
docker volume prune
```

### Nettoyage Complet (⚠️ Supprime tout)

```bash
cd backend

# Arrêter et supprimer tout
docker-compose down -v

# Supprimer toutes les images Docker
docker system prune -a --volumes

# Frontend - supprimer node_modules
cd ..
rm -rf node_modules
npm install
```

---

## 🔐 Sécurité

### Changer les Secrets

```bash
# Backend
cd backend
nano .env  # ou notepad .env sur Windows

# Modifier:
# JWT_SECRET=votre-nouveau-secret
# MINIO_ACCESS_KEY=nouveau-access-key
# MINIO_SECRET_KEY=nouveau-secret-key

# Redémarrer
docker-compose down
docker-compose up -d
```

### Voir les Variables d'Environnement

```bash
# D'un conteneur
docker exec mbolo-auth env

# D'un service
docker-compose config
```

---

## 📊 Monitoring

### Ressources

```bash
# Utilisation CPU/RAM de tous les conteneurs
docker stats

# Utilisation d'un conteneur spécifique
docker stats mbolo-auth

# Espace disque
docker system df
```

### Santé des Services

```bash
# Health check personnalisé
./health-check.sh    # Linux/Mac
health-check.bat     # Windows

# Health check Docker
docker ps --format "table {{.Names}}\t{{.Status}}"

# Actuator health endpoints
curl http://localhost:8080/actuator/health
curl http://localhost:8081/actuator/health
# ... etc pour 8082-8086
```

---

## 🆘 Dépannage Rapide

### Le backend ne démarre pas

```bash
cd backend
docker-compose down -v
docker-compose up -d --build
sleep 30
./init-databases.sh && ./init-minio.sh
```

### Port déjà utilisé

```bash
# Trouver le processus
# Windows
netstat -ano | findstr :8080
taskkill /PID [PID] /F

# Linux/Mac
lsof -ti:8080 | xargs kill -9
```

### Erreur de connexion DB

```bash
cd backend
docker-compose restart mongo-auth
sleep 10
./init-databases.sh
```

### Frontend ne se connecte pas au backend

```bash
# Vérifier les variables d'environnement
cat .env.local

# Devrait contenir:
# VITE_API_BASE_URL=http://localhost:8080
# VITE_WS_URL=ws://localhost:8080

# Redémarrer le frontend
npm run dev
```

---

## 📚 Ressources

- [README Principal](./README.md)
- [Guide Rapide](./QUICK_START.md)
- [Déploiement](./DEPLOYMENT.md)
- [État du Projet](./PROJECT_STATUS.md)
- [Contribution](./CONTRIBUTING.md)
- [Changelog](./CHANGELOG.md)

---

**💡 Astuce:** Ajoutez ce fichier à vos favoris pour un accès rapide!
