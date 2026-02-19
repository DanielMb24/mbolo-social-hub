# Changelog

Tous les changements notables de ce projet seront documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

## [1.0.0] - 2026-02-18

### 🎉 Version Initiale

#### Ajouté

##### Backend
- Architecture microservices avec 7 services
- API Gateway avec Spring Cloud Gateway
- Service d'authentification avec JWT (access + refresh tokens)
- Service utilisateur avec gestion de profils
- Service de chat avec WebSocket temps réel
- Service de publications avec commentaires
- Service vidéo avec upload MinIO
- Service de modération avec reports
- Configuration Docker Compose complète
- 6 instances MongoDB dédiées
- Redis pour cache et sessions
- MinIO pour stockage S3-compatible
- Health checks sur tous les services
- Profils Spring (local/docker)
- CORS configuré sur API Gateway
- Rate limiting
- Dockerfiles multi-stage optimisés

##### Frontend
- Application React 18 avec TypeScript
- Configuration Vite pour build rapide
- Tailwind CSS + shadcn/ui (50+ composants)
- React Router pour navigation
- TanStack Query pour data fetching
- Client API complet avec types TypeScript
- Gestion automatique des tokens JWT
- Auto-refresh des tokens expirés
- WebSocket client pour chat temps réel
- Upload de fichiers (avatars, vidéos, images)
- Pages: Auth, Feed, Profile, Chat, Video
- Variables d'environnement (.env.local)

##### DevOps & Outils
- Scripts d'installation automatique (Windows/Linux/Mac)
- Scripts de démarrage (backend, frontend, all)
- Scripts de vérification de santé
- Scripts d'initialisation DB et MinIO
- Makefile avec commandes simplifiées
- Configuration Git (.gitignore)
- Documentation complète:
  - README.md principal
  - QUICK_START.md
  - DEPLOYMENT.md
  - CONTRIBUTING.md
  - PROJECT_STATUS.md
  - CHANGELOG.md

##### Sécurité
- Authentification JWT avec refresh tokens
- Mots de passe hashés avec BCrypt (strength 12)
- CORS configuré
- Rate limiting sur API Gateway
- Variables d'environnement pour secrets
- Validation des entrées utilisateur

##### Base de Données
- Schémas MongoDB optimisés
- Index pour performance
- Collections:
  - users_auth (authentification)
  - user_profiles (profils)
  - conversations + messages (chat)
  - posts + comments (publications)
  - videos (vidéos)
  - reports + banned_users + audit_logs (modération)
  - refresh_tokens (sessions)

##### APIs Implémentées
- **Auth API**: login, register, refresh, logout
- **User API**: profils, avatar, search, follow/unfollow
- **Post API**: feed, create, like, comments
- **Video API**: upload, like, views
- **Chat API**: conversations, messages, WebSocket
- **Moderation API**: reports, bans, audit

#### Fonctionnalités

##### Authentification
- Inscription avec username/email/password
- Connexion (username, email ou phone)
- Tokens JWT (access 15min, refresh 7 jours)
- Auto-refresh automatique
- Déconnexion

##### Utilisateurs
- Profils utilisateurs complets
- Upload d'avatar vers MinIO
- Mise à jour du profil (bio, location, etc.)
- Recherche d'utilisateurs
- Système de follow/unfollow
- Liste des followers/following
- Blocage d'utilisateurs

##### Publications
- Fil d'actualité paginé
- Créer des publications avec texte
- Upload d'images
- Système de likes
- Commentaires
- Suppression de publications

##### Vidéos
- Liste des vidéos paginée
- Upload de vidéos vers MinIO
- Thumbnails automatiques
- Système de likes
- Compteur de vues
- Durée et métadonnées

##### Chat
- Conversations privées
- Messages temps réel via WebSocket
- Historique des messages paginé
- Statut lu/non lu
- Reconnexion automatique WebSocket
- Création de conversations

##### Modération
- Signalement de contenu (posts, videos, comments, users)
- Bannissement d'utilisateurs
- Logs d'audit
- Résolution des reports
- Actions: approve, reject, ban

#### Technique

##### Performance
- Build multi-stage Docker (images optimisées)
- JVM memory configuration pour containers
- Index MongoDB pour requêtes rapides
- Redis pour cache
- Pagination sur toutes les listes
- Lazy loading des images

##### Monitoring
- Health checks sur tous les services
- Actuator endpoints
- Logs structurés
- Scripts de vérification de santé

##### Développement
- Hot reload (Vite HMR)
- TypeScript strict mode
- ESLint configuré
- Prettier pour formatage
- Git hooks possibles

### 🔧 Configuration

#### Ports
- Frontend: 5173
- API Gateway: 8080
- Services Backend: 8081-8086
- MongoDB: 27017-27022
- Redis: 6379
- MinIO: 9000-9001

#### Variables d'Environnement
- JWT_SECRET (backend)
- MINIO_ACCESS_KEY (backend)
- MINIO_SECRET_KEY (backend)
- VITE_API_BASE_URL (frontend)
- VITE_WS_URL (frontend)

### 📚 Documentation

- Guide de démarrage rapide
- Documentation d'installation
- Guide de déploiement
- Guide de contribution
- Documentation API (Swagger)
- Exemples de code

### 🐛 Corrections

Aucune - Version initiale

### 🔒 Sécurité

- Pas de secrets hardcodés (utilisation de variables d'env)
- Validation des entrées
- Protection CSRF via JWT
- Rate limiting
- CORS configuré

---

## [Unreleased]

### À Venir
- Tests unitaires et d'intégration
- CI/CD avec GitHub Actions
- Monitoring avec Prometheus
- Service Discovery avec Eureka
- Notifications push
- Stories
- Live streaming

---

[1.0.0]: https://github.com/mbolo/mbolo/releases/tag/v1.0.0
