# Améliorations de la Messagerie Mbolo

## ✅ Fonctionnalités Implémentées

### 1. Backend - Service de Messagerie Complet

#### Nouvelles fonctionnalités du ChatService :
- ✅ **Conversations enrichies** : Dernier message, timestamp, compteur de non-lus
- ✅ **Création automatique de conversations privées** : `getOrCreatePrivateConversation()`
- ✅ **Marquage de lecture** : Par message ou par conversation entière
- ✅ **Suppression de messages** : Avec notification en temps réel
- ✅ **WebSocket intégré** : Notifications en temps réel via STOMP

#### Modèles améliorés :
```java
Conversation {
  - lastMessage: String
  - lastMessageTime: Instant
  - unreadCount: int
  - groupAvatar: String
}

Message {
  - senderName: String
  - senderAvatar: String
  - mediaUrl: String (pour images/vidéos)
  - deleted: boolean
  - updatedAt: Instant
}
```

#### Nouveaux endpoints :
- `GET /api/chat/conversations/private/{otherUserId}` - Créer/récupérer conversation privée
- `PUT /api/chat/messages/{messageId}/seen` - Marquer message comme lu
- `PUT /api/chat/conversations/{conversationId}/seen` - Marquer conversation comme lue
- `DELETE /api/chat/messages/{messageId}` - Supprimer un message

### 2. Système de Réinitialisation de Mot de Passe avec OTP

#### Nouveau modèle :
```java
PasswordResetToken {
  - email: String
  - otp: String (6 chiffres)
  - expiresAt: Instant (10 minutes)
  - used: boolean
}
```

#### Service d'envoi d'emails :
- ✅ Configuration SMTP (Gmail, Outlook, SendGrid)
- ✅ Génération sécurisée d'OTP à 6 chiffres
- ✅ Expiration automatique après 10 minutes
- ✅ Protection contre la réutilisation

#### Nouveaux endpoints :
- `POST /api/auth/forgot-password` - Demander un code OTP
- `POST /api/auth/reset-password` - Réinitialiser avec OTP

### 3. Frontend - API Client

#### Nouveau fichier `src/lib/chat-api.ts` :
- Toutes les fonctions pour gérer les conversations
- Gestion des messages avec pagination
- Marquage de lecture
- Suppression de messages

#### Nouveau fichier `src/lib/websocket.ts` :
- Service WebSocket avec reconnexion automatique
- Abonnement aux conversations
- Gestion des événements (nouveau message, lecture, suppression)

#### Nouveau fichier `src/lib/auth-api.ts` :
- API pour réinitialisation de mot de passe
- Gestion des erreurs

## 🔧 Configuration Requise

### 1. Configuration Email (Auth Service)

Créer un fichier `.env` dans `backend/auth-service/` :

```env
MAIL_USERNAME=votre-email@gmail.com
MAIL_PASSWORD=votre-mot-de-passe-application
```

**Important** : Pour Gmail, utilisez un "mot de passe d'application", pas votre mot de passe normal.

Voir `backend/EMAIL_CONFIGURATION.md` pour les instructions détaillées.

### 2. Dépendances Frontend

Installer les dépendances WebSocket :

```bash
npm install sockjs-client @stomp/stompjs
npm install --save-dev @types/sockjs-client
```

Ou exécuter : `install-chat-deps.bat`

### 3. Configuration Docker

Ajouter dans `docker-compose.yml` pour auth-service :

```yaml
auth-service:
  environment:
    - MAIL_USERNAME=${MAIL_USERNAME}
    - MAIL_PASSWORD=${MAIL_PASSWORD}
```

## 📋 Prochaines Étapes

### Pour utiliser la messagerie en temps réel :

1. **Installer les dépendances** :
   ```bash
   install-chat-deps.bat
   ```

2. **Mettre à jour ChatPage.tsx** pour utiliser les vraies données :
   - Remplacer MOCK_CONVERSATIONS par `chatApi.getConversations()`
   - Remplacer MOCK_MESSAGES par `chatApi.getMessages(conversationId)`
   - Intégrer `wsService` pour les mises à jour en temps réel

3. **Ajouter le composant de réinitialisation de mot de passe** dans AuthPage.tsx :
   - Formulaire "Mot de passe oublié"
   - Saisie de l'email
   - Saisie du code OTP
   - Nouveau mot de passe

### Pour tester l'envoi d'emails :

1. **Configurer Gmail** :
   - Activer la validation en deux étapes
   - Créer un mot de passe d'application
   - Ajouter dans `.env`

2. **Tester l'endpoint** :
   ```bash
   curl -X POST http://localhost:8081/api/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```

3. **Vérifier les logs** :
   ```bash
   docker logs mbolo-auth-service
   ```

## 🎯 Fonctionnalités Avancées à Implémenter

### Messagerie :
- [ ] Upload d'images/vidéos dans les messages
- [ ] Messages vocaux
- [ ] Indicateur "en train d'écrire..."
- [ ] Réactions aux messages (emoji)
- [ ] Réponses/citations de messages
- [ ] Recherche dans les messages
- [ ] Archivage de conversations

### Authentification :
- [ ] Authentification à deux facteurs (2FA)
- [ ] Connexion avec Google/Facebook
- [ ] Historique des connexions
- [ ] Gestion des sessions actives
- [ ] Notification de connexion suspecte

## 🐛 Dépannage

### Les emails ne sont pas envoyés :
1. Vérifier les logs : `docker logs mbolo-auth-service`
2. Vérifier la configuration SMTP dans `application.yml`
3. Tester la connexion SMTP manuellement
4. Voir `EMAIL_CONFIGURATION.md` pour plus de détails

### WebSocket ne se connecte pas :
1. Vérifier que chat-service est démarré : `docker ps`
2. Vérifier les logs : `docker logs mbolo-chat-service`
3. Vérifier l'URL WebSocket dans `websocket.ts`
4. Tester avec un client WebSocket (Postman, wscat)

### Messages non reçus en temps réel :
1. Vérifier la connexion WebSocket dans la console du navigateur
2. Vérifier que l'abonnement à la conversation est actif
3. Vérifier les logs du chat-service

## 📚 Documentation Technique

### Architecture WebSocket :
```
Client (React) 
  ↓ SockJS
WebSocket Connection
  ↓ STOMP Protocol
Chat Service (Spring)
  ↓ SimpMessagingTemplate
MongoDB (Messages)
```

### Flow de réinitialisation de mot de passe :
```
1. User → POST /forgot-password → Auth Service
2. Auth Service → Generate OTP → Save to DB
3. Auth Service → Send Email → User's inbox
4. User → Enter OTP → POST /reset-password
5. Auth Service → Verify OTP → Update password
6. Auth Service → Invalidate all sessions
```

## 🚀 Déploiement

### Variables d'environnement requises :

```env
# Auth Service
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
JWT_SECRET=your-secret-key

# Chat Service
MONGODB_URI=mongodb://localhost:27017/mbolo_chat
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Commandes de démarrage :

```bash
# Backend complet
cd backend
docker-compose up -d

# Frontend
npm run dev

# Vérifier les services
docker ps
curl http://localhost:8081/actuator/health
curl http://localhost:8083/actuator/health
```
