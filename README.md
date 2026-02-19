# MBolo - Plateforme Sociale Full-Stack

MBolo est une plateforme sociale moderne construite avec une architecture microservices.

## 🏗️ Architecture

### Frontend
- **React 18** + **TypeScript**
- **Vite** pour le build rapide
- **Tailwind CSS** + **shadcn/ui** pour l'interface
- **React Router** pour la navigation
- **TanStack Query** pour la gestion des données

### Backend
- **Spring Boot 3.2.5** (Java 17)
- **Architecture Microservices**:
  - API Gateway (port 8080)
  - Auth Service (port 8081)
  - User Service (port 8082)
  - Chat Service (port 8083)
  - Post Service (port 8084)
  - Video Service (port 8085)
  - Moderation Service (port 8086)

### Infrastructure
- **MongoDB** (6 instances dédiées)
- **Redis** (cache et sessions)
- **MinIO** (stockage S3-compatible)
- **Docker** + **Docker Compose**

## 🚀 Installation Rapide

### Prérequis
- Docker Desktop
- Node.js 18+
- npm ou yarn

### Installation Automatique

**Windows:**
```bash
install.bat
```

**Linux/Mac:**
```bash
chmod +x install.sh
./install.sh
```

### Installation Manuelle

1. **Installer les dépendances Frontend:**
```bash
npm install
```

2. **Démarrer le Backend:**
```bash
cd backend
docker-compose up -d
```

### 3. Initialiser les bases de données:**
```bash
cd backend
# Windows
init-databases.bat
seed-test-data.bat

# Linux/Mac
chmod +x init-databases-advanced.sh seed-test-data.sh
./init-databases-advanced.sh
./seed-test-data.sh
```

4. **Démarrer le Frontend:**
```bash
npm run dev
```

## 🗄️ Base de Données

MBolo utilise **6 instances MongoDB dédiées**, une par domaine fonctionnel:

- **mbolo_auth** (port 27017) - Authentification et tokens
- **mbolo_user** (port 27018) - Profils utilisateurs
- **mbolo_chat** (port 27019) - Conversations et messages
- **mbolo_post** (port 27020) - Publications et commentaires
- **mbolo_video** (port 27021) - Vidéos et vues
- **mbolo_moderation** (port 27022) - Modération et rapports

### Initialisation

Les bases de données sont initialisées automatiquement lors de l'installation. Pour réinitialiser:

```bash
cd backend
./init-databases-advanced.sh  # Linux/Mac
init-databases.bat            # Windows
```

### Données de Test

Pour insérer des données de test (utilisateur: testuser / test123):

```bash
cd backend
./seed-test-data.sh    # Linux/Mac
seed-test-data.bat     # Windows
```

### Documentation

- [Guide Complet de la Base de Données](./backend/DATABASE.md)
- [Référence Rapide](./backend/DATABASE_QUICK_REFERENCE.md)

## 📱 Accès à l'Application

- **Frontend:** http://localhost:5173
- **API Gateway:** http://localhost:8080
- **MinIO Console:** http://localhost:9001
  - Username: `mbolo_admin`
  - Password: `mbolo_secret_2025`

## 🔧 Commandes Utiles

### Backend

```bash
# Démarrer tous les services
cd backend && docker-compose up -d

# Voir les logs
cd backend && docker-compose logs -f

# Voir les logs d'un service spécifique
cd backend && docker-compose logs -f auth-service

# Arrêter tous les services
cd backend && docker-compose down

# Rebuild un service
cd backend && docker-compose up -d --build auth-service

# Vérifier le statut
cd backend && docker-compose ps
```

### Frontend

```bash
# Développement
npm run dev

# Build production
npm run build

# Preview production
npm run preview

# Tests
npm run test

# Linting
npm run lint
```

## 📚 Documentation

- [Guide de Déploiement](./DEPLOYMENT.md)
- [Documentation Backend](./backend/DEPLOYMENT.md)
- [API Documentation](http://localhost:8080/swagger-ui.html) (après démarrage)

## 🏗️ Structure du Projet

```
mbolo/
├── backend/
│   ├── api-gateway/          # Point d'entrée API
│   ├── auth-service/         # Authentification JWT
│   ├── user-service/         # Gestion des profils
│   ├── chat-service/         # Messagerie temps réel
│   ├── post-service/         # Publications
│   ├── video-service/        # Vidéos
│   ├── moderation-service/   # Modération
│   └── docker-compose.yml    # Orchestration
├── src/
│   ├── components/           # Composants React
│   ├── lib/
│   │   ├── api.ts           # Client API complet
│   │   └── utils.ts         # Utilitaires
│   └── pages/               # Pages de l'application
├── .env.local               # Variables d'environnement
└── package.json             # Dépendances npm
```

## 🔐 Sécurité

- Authentification JWT avec refresh tokens
- Tokens stockés en localStorage
- CORS configuré sur l'API Gateway
- Mots de passe hashés avec BCrypt
- Rate limiting sur l'API Gateway

## 🌐 Endpoints API

Tous les endpoints passent par l'API Gateway (`http://localhost:8080`):

### Auth
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/refresh` - Rafraîchir le token
- `GET /api/auth/me` - Utilisateur actuel

### Users
- `GET /api/users/:id` - Profil utilisateur
- `PUT /api/users/:id` - Mettre à jour le profil
- `POST /api/users/:id/avatar` - Upload avatar
- `GET /api/users/search?q=` - Rechercher des utilisateurs

### Posts
- `GET /api/posts/feed` - Fil d'actualité
- `POST /api/posts` - Créer une publication
- `POST /api/posts/:id/like` - Liker
- `GET /api/posts/:id/comments` - Commentaires

### Videos
- `GET /api/videos` - Liste des vidéos
- `POST /api/videos` - Upload vidéo
- `POST /api/videos/:id/like` - Liker

### Chat
- `GET /api/chat/conversations` - Conversations
- `POST /api/chat/conversations/:id/messages` - Envoyer un message
- `WS /ws-chat` - WebSocket temps réel

## 🧪 Tests

```bash
# Frontend
npm run test

# Backend (exemple pour auth-service)
cd backend/auth-service
mvn test
```

## 🐛 Troubleshooting

### Les services ne démarrent pas
```bash
cd backend
docker-compose down -v
docker-compose up -d --build
```

### Erreur de connexion MongoDB
Vérifiez que les profils Spring sont corrects:
- Local: utilise `localhost`
- Docker: utilise les noms de services

### Port déjà utilisé
Vérifiez qu'aucun autre service n'utilise les ports 8080-8086, 5173, 6379, 9000-9001, 27017-27022.

## 📄 Licence

Ce projet est sous licence MIT.

## 👥 Contribution

Les contributions sont les bienvenues! Veuillez créer une issue ou une pull request.

## 📞 Support

Pour toute question ou problème, ouvrez une issue sur GitHub.
