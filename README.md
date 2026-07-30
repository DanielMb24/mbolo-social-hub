# MBolo - Réseau Social du Gabon 🇬🇦

## 📱 Description

MBolo est une plateforme de réseau social moderne et complète, conçue spécifiquement pour la communauté gabonaise. L'application offre une expérience utilisateur fluide et intuitive, inspirée des meilleures pratiques des réseaux sociaux populaires comme Facebook et Instagram.

## ✨ Fonctionnalités principales

### 🔐 Authentification
- Inscription et connexion sécurisées
- Authentification Google OAuth
- Récupération de mot de passe
- Gestion de sessions avec JWT (Access & Refresh tokens)

### 📰 Fil d'actualité (Feed)
- Publication de posts avec texte et médias
- Système de réactions (Like, Love, Haha, Wow, Sad, Angry)
- Commentaires avec réponses imbriquées
- Partage de publications
- Chargement infini (infinite scroll)
- Mise à jour optimiste pour une UX fluide

### 💬 Messagerie instantanée
- Chat en temps réel avec WebSocket (STOMP)
- Conversations privées
- Envoi de messages texte, images, fichiers
- Enregistrement et envoi de messages vocaux
- Indicateur de saisie en temps réel
- Statut en ligne/hors ligne
- Réactions aux messages
- Transfert de messages
- Suppression de messages
- Appels audio/vidéo (interface prête)

### 📖 Stories (24h)
- Création de stories texte ou image
- Visualisation en plein écran
- Expiration automatique après 24h
- Compteur de vues
- Gestion de ses propres stories

### 🎥 Vidéos
- Upload et partage de vidéos
- Lecteur vidéo intégré
- Système de likes
- Compteur de vues
- Miniatures automatiques

### 👤 Profils utilisateurs
- Page de profil personnalisable
- Photo de profil et photo de couverture
- Bio, localisation, informations personnelles
- Statistiques (posts, abonnés, abonnements)
- Onglets: Publications, Vidéos, Enregistrés
- Système de follow/unfollow

### 🔍 Exploration
- Page Explorer pour découvrir du contenu
- Recherche globale (utilisateurs, posts, vidéos)
- Suggestions de personnes à suivre
- Tendances et hashtags

### 🔔 Notifications
- Notifications en temps réel
- Badge de compteur non lus
- Panel de notifications

### 📱 Responsive Design
- Interface adaptative mobile/tablette/desktop
- Navigation style Facebook avec onglets en haut
- Menu latéral sur mobile
- Optimisé pour toutes les tailles d'écran

## 🛠️ Stack technique

### Frontend
- **Framework**: React 18 + TypeScript
- **Build tool**: Vite
- **Routing**: React Router v6
- **State Management**: TanStack Query (React Query)
- **UI Components**: Radix UI + shadcn/ui
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod
- **Notifications**: Sonner
- **WebSocket**: STOMP.js + SockJS
- **OAuth**: @react-oauth/google

### Backend (API)
- **Framework**: Spring Boot (Java)
- **Base URL**: `http://localhost:8080`
- **WebSocket**: STOMP over SockJS
- **Authentification**: JWT

### Mobile
- **Capacitor**: Support Android natif

## 📂 Structure du projet

```
mbolo-social-hub/
├── src/
│   ├── components/
│   │   ├── mbolo/              # Composants principaux
│   │   │   ├── AuthPage.tsx    # Authentification
│   │   │   ├── FeedPage.tsx    # Fil d'actualité
│   │   │   ├── ChatPage.tsx    # Messagerie
│   │   │   ├── VideoPage.tsx   # Vidéos
│   │   │   ├── ProfilePage.tsx # Profil
│   │   │   ├── StoryManager.tsx # Gestion stories
│   │   │   └── ...
│   │   └── ui/                 # Composants UI réutilisables
│   ├── lib/
│   │   ├── api.ts              # Client API
│   │   ├── format-utils.ts     # Utilitaires de formatage
│   │   └── reaction-constants.ts # Constantes réactions
│   ├── hooks/
│   │   ├── use-reactions.ts    # Hook réactions optimistes
│   │   ├── use-mobile.ts       # Détection mobile
│   │   └── use-online-status.ts # Statut en ligne
│   ├── pages/
│   │   └── Index.tsx           # Page principale
│   └── main.tsx                # Point d'entrée
├── android/                    # Application Android
├── public/                     # Assets statiques
└── package.json
```

## 🚀 Installation et démarrage

### Prérequis
- Node.js 18+
- npm ou yarn
- Backend Spring Boot en cours d'exécution sur le port 8080

### Installation
```bash
# Cloner le projet
git clone <repository-url>
cd mbolo-social-hub

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos configurations
```

### Variables d'environnement
```env
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Développement
```bash
# Démarrer le serveur de développement
npm run dev

# L'application sera accessible sur http://localhost:5173
```

### Production
```bash
# Build de production
npm run build

# Prévisualiser le build
npm run preview
```

### Déploiement Vercel

Le frontend est prêt pour Vercel avec `vercel.json`.

Paramètres du projet Vercel:
- **Framework Preset**: Vite
- **Install Command**: `npm ci`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

Variables d'environnement à configurer dans Vercel:
```env
VITE_API_BASE_URL=
VITE_WS_URL=
VITE_ENV=production
VITE_GOOGLE_CLIENT_ID=votre_google_client_id
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/mbolo
MONGODB_SERVICE_PREFIX=mbolo
JWT_SECRET=une_longue_valeur_secrete
```

Le dossier `api/` contient une version serverless du backend pour Vercel. Elle utilise MongoDB Atlas via `MONGODB_URI` et lit les bases existantes `mbolo_auth`, `mbolo_user`, `mbolo_post`, `mbolo_chat`, `mbolo_video` avec le préfixe `MONGODB_SERVICE_PREFIX=mbolo`. Les uploads de fichiers et les WebSockets persistants doivent être connectés ensuite à des services externes compatibles serverless.

### Android
```bash
# Build et sync Android
npm run build
npx cap sync android
npx cap open android
```

## 🎨 Design System

### Palette de couleurs
- **Primary**: Bleu (#3b82f6) - Actions principales
- **Secondary**: Gris clair - Arrière-plans
- **Destructive**: Rouge - Actions destructives
- **Muted**: Gris - Textes secondaires

### Composants réutilisables
- `.btn-primary` - Bouton principal
- `.btn-accent` - Bouton accentué
- `.input-modern` - Input moderne
- `.card-modern` - Carte avec ombre

## 📊 Optimisations

### Performance
- Code splitting automatique
- Lazy loading des composants
- Images optimisées
- Cache React Query (staleTime: 60s, cacheTime: 5min)
- Mise à jour optimiste pour les réactions

### Build
- Minification esbuild
- Tree shaking
- Compression gzip
- Build time: ~4-10s

## 🔧 API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription
- `POST /api/auth/refresh` - Rafraîchir le token
- `GET /api/auth/me` - Utilisateur actuel

### Utilisateurs
- `GET /api/users/:id` - Profil utilisateur
- `PUT /api/users/:id` - Mettre à jour profil
- `POST /api/users/:id/avatar` - Upload avatar
- `POST /api/users/:id/cover` - Upload couverture
- `POST /api/users/:id/follow` - Suivre
- `DELETE /api/users/:id/follow` - Ne plus suivre

### Posts
- `GET /api/posts` - Liste des posts
- `POST /api/posts` - Créer un post
- `POST /api/posts/:id/like` - Liker/unliker
- `GET /api/posts/:id/comments` - Commentaires
- `POST /api/posts/:id/comments` - Ajouter commentaire

### Vidéos
- `GET /api/videos` - Liste des vidéos
- `POST /api/videos` - Upload vidéo
- `DELETE /api/videos/:id` - Supprimer vidéo
- `POST /api/videos/:id/like` - Liker vidéo
- `POST /api/videos/:id/view` - Incrémenter vues

### Chat
- `GET /api/chat/conversations` - Conversations
- `GET /api/chat/conversations/:id/messages` - Messages
- `POST /api/chat/conversations/:id/messages` - Envoyer message
- `POST /api/chat/upload` - Upload fichier

### WebSocket
- Endpoint: `/ws-chat`
- Protocol: STOMP over SockJS

## 🐛 Problèmes connus

### CORS WebSocket
Le WebSocket nécessite une configuration CORS côté backend:
```java
@Configuration
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-chat")
                .setAllowedOrigins("http://localhost:5173")
                .withSockJS();
    }
}
```

## 📝 Changelog

### Version actuelle
- ✅ Palette de couleurs optimisée (bleu principal)
- ✅ Stories connectées à l'API réelle
- ✅ Upload photos de profil et couverture
- ✅ Responsive design mobile/desktop
- ✅ Système de réactions optimiste
- ✅ Formatage des dates et nombres
- ✅ Affichage des vrais usernames

## 👥 Contribution

Ce projet est développé pour la communauté gabonaise. Les contributions sont les bienvenues!

## 📄 Licence

Propriétaire - Tous droits réservés

## 🌍 Contact

Pour toute question ou suggestion, contactez l'équipe MBolo.

---

**MBolo** - Connectons le Gabon 🇬🇦
