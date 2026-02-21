# 🔧 Erreurs Backend à Corriger

## ✅ Erreurs Frontend Corrigées

### 1. Unlike Post - 405 Method Not Allowed
**Problème** : L'API frontend utilisait DELETE mais le backend attend POST (toggle)
**Solution** : Modifié `unlikePost` pour utiliser POST au lieu de DELETE
**Fichier** : `src/lib/api.ts`

### 2. Gestion des Erreurs Upload
**Problème** : Messages d'erreur génériques, pas de détails
**Solution** : Ajout de parsing des erreurs JSON du backend
**Fichiers** : `src/components/mbolo/ChatPage.tsx`

---

## 🚨 Erreurs Backend à Corriger IMMÉDIATEMENT

### 1. Upload Audio/Fichiers - 400 Bad Request

**Endpoint** : `POST /api/chat/upload`

**Problème** : 
- Le backend attend un header `X-User-Id` 
- L'API Gateway doit extraire l'userId du JWT et l'ajouter comme header
- Actuellement, seul `Authorization: Bearer <token>` est envoyé

**Localisation** :
```java
// backend/chat-service/src/main/java/com/mbolo/chat/controller/ChatController.java
@PostMapping("/upload")
public ResponseEntity<Map<String, Object>> uploadFile(
    @RequestHeader("X-User-Id") String userId,  // ← Attend ce header
    @RequestParam("file") MultipartFile file,
    @RequestParam("conversationId") String conversationId,
    @RequestParam("type") String type)
```

**Solution Requise** :
1. **Option A** : Modifier l'API Gateway pour extraire userId du JWT et l'ajouter comme header
2. **Option B** : Modifier le controller pour accepter le token JWT directement

**Fichiers à Modifier** :
- `backend/api-gateway/src/main/java/com/mbolo/gateway/filter/JwtAuthFilter.java`
- Ajouter extraction userId et injection dans header `X-User-Id`

**Code Suggéré pour API Gateway** :
```java
// Dans JwtAuthFilter.java
String userId = jwtUtil.extractUserId(token);
exchange.getRequest().mutate()
    .header("X-User-Id", userId)
    .build();
```

---

### 2. WebSocket CORS - Connexion Bloquée

**Endpoint** : `ws://localhost:8083/ws-chat`

**Erreur** :
```
Access to XMLHttpRequest at 'http://localhost:8083/ws-chat/info?t=...' 
from origin 'http://localhost:5173' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present
```

**Problème** :
- Le chat-service n'autorise pas les connexions WebSocket depuis localhost:5173
- Configuration CORS manquante pour WebSocket

**Localisation** :
```java
// backend/chat-service/src/main/java/com/mbolo/chat/config/WebSocketConfig.java
```

**Solution Requise** :
Ajouter configuration CORS pour WebSocket

**Code Suggéré** :
```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-chat")
            .setAllowedOriginPatterns("*")  // ← Ajouter ceci
            .withSockJS();
    }
    
    // ... reste de la config
}
```

---

### 3. Multipart File Upload Configuration

**Problème Potentiel** :
- Limite de taille des fichiers peut être trop petite
- Timeout trop court pour les gros fichiers

**Fichiers à Vérifier** :
```yaml
# backend/chat-service/src/main/resources/application.yml
spring:
  servlet:
    multipart:
      max-file-size: 50MB      # ← Vérifier
      max-request-size: 50MB   # ← Vérifier
```

**Recommandation** :
- Images : max 10MB
- Audio : max 25MB
- Vidéos : max 100MB
- Fichiers : max 50MB

---

## 🔍 Autres Problèmes Détectés

### 4. React DevTools Errors (Non-Critique)

**Erreur** :
```
Uncaught Error: Attempting to use a disconnected port object
```

**Cause** : Extension React DevTools
**Impact** : Aucun sur l'application
**Solution** : Ignorer ou désactiver React DevTools en production

---

## 📋 Checklist de Correction Backend

### Priorité CRITIQUE
- [ ] Ajouter extraction userId dans API Gateway (JwtAuthFilter)
- [ ] Configurer CORS WebSocket dans chat-service
- [ ] Tester upload audio/fichiers
- [ ] Tester connexion WebSocket

### Priorité HAUTE
- [ ] Vérifier limites multipart file upload
- [ ] Ajouter logs détaillés pour debug upload
- [ ] Tester avec différents types de fichiers
- [ ] Vérifier timeout des requêtes

### Priorité MOYENNE
- [ ] Ajouter validation taille fichiers côté backend
- [ ] Ajouter validation type MIME
- [ ] Implémenter compression images côté backend
- [ ] Ajouter scan antivirus (optionnel)

---

## 🚀 Instructions de Test

### Après Correction API Gateway

1. **Redémarrer les services** :
```bash
cd backend
docker-compose restart api-gateway chat-service
```

2. **Tester upload audio** :
- Ouvrir une conversation
- Cliquer sur le micro
- Enregistrer un message
- Vérifier dans les logs : `docker-compose logs -f chat-service`

3. **Tester upload fichier** :
- Ouvrir une conversation
- Cliquer sur le trombone
- Sélectionner une image
- Vérifier l'envoi

4. **Tester WebSocket** :
- Ouvrir deux navigateurs
- Se connecter avec deux comptes différents
- Envoyer un message
- Vérifier réception en temps réel

---

## 📝 Logs à Vérifier

### Chat Service
```bash
docker-compose logs -f chat-service | grep -i "upload\|error"
```

### API Gateway
```bash
docker-compose logs -f api-gateway | grep -i "jwt\|user-id"
```

### Tous les services
```bash
docker-compose logs -f
```

---

## 🔧 Code Backend à Ajouter

### 1. JwtAuthFilter.java (API Gateway)

```java
// backend/api-gateway/src/main/java/com/mbolo/gateway/filter/JwtAuthFilter.java

// Dans la méthode filter(), après validation du token :

if (jwtUtil.validateToken(token)) {
    // Extraire userId du token
    String userId = jwtUtil.extractUserId(token);
    
    // Ajouter header X-User-Id
    ServerHttpRequest modifiedRequest = exchange.getRequest().mutate()
        .header("X-User-Id", userId)
        .build();
    
    ServerWebExchange modifiedExchange = exchange.mutate()
        .request(modifiedRequest)
        .build();
    
    return chain.filter(modifiedExchange);
}
```

### 2. JwtUtil.java (API Gateway)

```java
// Ajouter cette méthode si elle n'existe pas

public String extractUserId(String token) {
    Claims claims = extractAllClaims(token);
    return claims.get("userId", String.class);
}
```

### 3. WebSocketConfig.java (Chat Service)

```java
@Override
public void registerStompEndpoints(StompEndpointRegistry registry) {
    registry.addEndpoint("/ws-chat")
        .setAllowedOriginPatterns("*")
        .setAllowedOrigins(
            "http://localhost:5173",
            "http://localhost:3000",
            "https://mbolo-frontend.onrender.com"
        )
        .withSockJS();
}
```

---

## ✅ Résultat Attendu

Après ces corrections :
- ✅ Upload audio fonctionne
- ✅ Upload fichiers/images fonctionne
- ✅ WebSocket se connecte sans erreur CORS
- ✅ Messages en temps réel fonctionnent
- ✅ Unlike post fonctionne (déjà corrigé frontend)

---

**Date** : 21 février 2026
**Statut** : Frontend corrigé, Backend à corriger
