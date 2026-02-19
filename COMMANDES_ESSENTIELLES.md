# ⚡ Commandes Essentielles - MBolo

## 🚀 Démarrage

### Démarrer Backend
```bash
cd backend
docker-compose up -d
```

### Démarrer Frontend
```bash
npm run dev
```

### Ouvrir l'App
```
http://localhost:5174
```

---

## 🔍 Vérification

### Voir tous les services
```bash
cd backend
docker-compose ps
```

### Voir les logs d'un service
```bash
cd backend
docker-compose logs -f user-service
docker-compose logs -f api-gateway
docker-compose logs -f auth-service
```

### Voir les dernières lignes
```bash
cd backend
docker-compose logs --tail=20 user-service
```

---

## 🔄 Redémarrage

### Redémarrer un service
```bash
cd backend
docker-compose restart user-service
docker-compose restart api-gateway
```

### Redémarrer tous les services
```bash
cd backend
docker-compose restart
```

---

## 🛠️ Rebuild

### Rebuild User Service (sans cache)
```bash
cd backend
.\rebuild-user-service-no-cache.bat
```

### Rebuild tous les services
```bash
cd backend
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Rebuild un service spécifique
```bash
cd backend
docker-compose build --no-cache user-service
docker-compose up -d user-service
```

---

## 🛑 Arrêt

### Arrêter tous les services
```bash
cd backend
docker-compose down
```

### Arrêter et supprimer les volumes
```bash
cd backend
docker-compose down -v
```

### Arrêter un service spécifique
```bash
cd backend
docker-compose stop user-service
```

---

## 🧹 Nettoyage

### Supprimer les images inutilisées
```bash
docker image prune -a
```

### Supprimer les conteneurs arrêtés
```bash
docker container prune
```

### Supprimer tout (ATTENTION!)
```bash
docker system prune -a --volumes
```

---

## 📊 Monitoring

### Voir l'utilisation des ressources
```bash
docker stats
```

### Voir les processus dans un conteneur
```bash
docker-compose exec user-service ps aux
```

### Entrer dans un conteneur
```bash
docker-compose exec user-service sh
```

---

## 🔧 Debug

### Vérifier la santé d'un service
```bash
curl http://localhost:8082/actuator/health
curl http://localhost:8080/actuator/health
```

### Tester un endpoint
```bash
# Avec token
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8080/api/users/search?q=

# Sans token (login)
curl -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"test\",\"password\":\"test123\"}"
```

### Voir les variables d'environnement
```bash
docker-compose exec user-service env
```

---

## 📦 NPM (Frontend)

### Installer les dépendances
```bash
npm install
```

### Build production
```bash
npm run build
```

### Preview build
```bash
npm run preview
```

### Linter
```bash
npm run lint
```

---

## 🗄️ MongoDB

### Se connecter à MongoDB local
```bash
docker-compose exec mongo-user mongosh
```

### Voir les bases de données
```javascript
show dbs
use userDb
show collections
```

### Compter les documents
```javascript
db.userProfiles.countDocuments()
db.user_follows.countDocuments()
```

### Voir les follows
```javascript
db.user_follows.find().pretty()
```

---

## 🔑 Tokens JWT

### Décoder un token (online)
```
https://jwt.io
```

### Voir le token stocké (DevTools Console)
```javascript
localStorage.getItem('token')
localStorage.getItem('userId')
```

---

## 🌐 Ports

| Service | Port |
|---------|------|
| Frontend | 5174 |
| API Gateway | 8080 |
| Auth Service | 8081 |
| User Service | 8082 |
| Chat Service | 8083 |
| Post Service | 8084 |
| Video Service | 8085 |
| Moderation | 8086 |
| MongoDB Auth | 27017 |
| MongoDB User | 27018 |
| MongoDB Chat | 27019 |
| MongoDB Post | 27020 |
| MongoDB Video | 27021 |
| MongoDB Mod | 27022 |
| Redis | 6379 |
| MinIO | 9000-9001 |

---

## 🆘 En Cas de Problème

### Problème: Services ne démarrent pas
```bash
cd backend
docker-compose down
docker-compose up -d
docker-compose logs -f
```

### Problème: 404 sur endpoints
```bash
cd backend
docker-compose restart api-gateway
docker-compose restart user-service
```

### Problème: Frontend ne charge pas
```bash
npm install
npm run dev
```

### Problème: Erreurs TypeScript
```bash
npm run build
# Voir les erreurs et corriger
```

### Problème: Docker out of space
```bash
docker system prune -a
docker volume prune
```

---

## 📚 Logs Utiles

### Voir tous les logs
```bash
cd backend
docker-compose logs -f
```

### Filtrer les logs
```bash
cd backend
docker-compose logs -f | grep ERROR
docker-compose logs -f | grep "is-following"
```

### Sauvegarder les logs
```bash
cd backend
docker-compose logs > logs.txt
```

---

## 🎯 Commandes Rapides

### Tout redémarrer
```bash
cd backend && docker-compose restart && cd ..
```

### Rebuild user-service et restart gateway
```bash
cd backend && .\rebuild-user-service-no-cache.bat && docker-compose restart api-gateway
```

### Voir le statut complet
```bash
cd backend && docker-compose ps && docker-compose logs --tail=5 user-service
```

---

**Garde ce fichier sous la main pour référence rapide! 📌**
