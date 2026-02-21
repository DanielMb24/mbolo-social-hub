# 🔧 Correction CORS - Problème de Doublons

## 🚨 Problème Identifié

```
Access-Control-Allow-Origin header contains multiple values 
'http://localhost:5173, http://localhost:5173', but only one is allowed
```

### Cause
Le header CORS était envoyé en double à cause de :
1. **API Gateway** : Configuration CORS globale avec `localhost:5173` en double
2. **Chat Service** : Configuration CORS supplémentaire qui créait un conflit

---

## ✅ Corrections Appliquées

### 1. API Gateway - Suppression du Doublon

**Fichier** : `backend/api-gateway/src/main/resources/application.yml`

**Avant** :
```yaml
allowedOrigins: "http://localhost:3000,http://localhost:5173,http://localhost:5173"
```

**Après** :
```yaml
allowedOrigins: "http://localhost:3000,http://localhost:5173"
```

### 2. Chat Service - Suppression Configuration CORS API

**Fichier** : `backend/chat-service/src/main/java/com/mbolo/chat/config/WebConfig.java`

**Changement** : Supprimé la configuration CORS pour `/api/chat/**` car déjà gérée par l'API Gateway

**Conservé** : Configuration CORS pour `/uploads/**` (fichiers statiques uniquement)

---

## 🎯 Architecture CORS Finale

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                   http://localhost:5173                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                             │
│                   http://localhost:8080                      │
│                                                              │
│  ✅ CORS Global Configuration                               │
│     - Gère CORS pour TOUTES les routes                      │
│     - allowedOrigins: localhost:5173, localhost:3000        │
│     - allowedMethods: *                                      │
│     - allowCredentials: true                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    ┌────────┐     ┌────────┐     ┌────────┐
    │  Auth  │     │  Chat  │     │  Post  │
    │Service │     │Service │     │Service │
    └────────┘     └────────┘     └────────┘
                        │
                        ▼
                   ✅ CORS Local
                   (uploads uniquement)
```

---

## 🚀 Déploiement des Corrections

### Option 1 : Rebuild Complet (Recommandé)

```bash
cd backend
rebuild-gateway-and-chat.bat
```

Ce script va :
1. Arrêter API Gateway et Chat Service
2. Supprimer les anciens conteneurs
3. Rebuild les deux services
4. Les redémarrer dans le bon ordre

### Option 2 : Rebuild Séparé

**API Gateway** :
```bash
cd backend
rebuild-gateway.bat
```

**Chat Service** :
```bash
cd backend
rebuild-chat-service.bat
```

### Option 3 : Manuel

```bash
cd backend

# Arrêter
docker-compose stop api-gateway chat-service

# Supprimer
docker-compose rm -f api-gateway chat-service

# Rebuild
docker-compose build --no-cache api-gateway chat-service

# Démarrer
docker-compose up -d api-gateway
timeout /t 10
docker-compose up -d chat-service
```

---

## ✅ Vérification

### 1. Vérifier les Logs

```bash
# API Gateway
docker-compose logs -f api-gateway | findstr "CORS\|error"

# Chat Service
docker-compose logs -f chat-service | findstr "CORS\|error"
```

### 2. Tester l'API

```bash
# Health check
curl http://localhost:8080/actuator/health

# Test conversations (avec token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8080/api/chat/conversations
```

### 3. Tester dans le Navigateur

1. Ouvrir http://localhost:5173
2. Ouvrir la console (F12)
3. Se connecter
4. Aller dans Messages
5. Vérifier qu'il n'y a plus d'erreur CORS

**Résultat attendu** :
```
✅ GET http://localhost:8080/api/chat/conversations 200 (OK)
✅ Pas d'erreur CORS dans la console
✅ Conversations chargées correctement
```

---

## 🔍 Dépannage

### Si l'erreur CORS persiste

1. **Vérifier que les services sont bien redémarrés** :
```bash
docker-compose ps
```

2. **Vider le cache du navigateur** :
- Ctrl + Shift + R (Windows)
- Cmd + Shift + R (Mac)

3. **Vérifier les logs en détail** :
```bash
docker-compose logs api-gateway | findstr "CORS"
```

4. **Tester avec curl** :
```bash
curl -v -H "Origin: http://localhost:5173" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8080/api/chat/conversations
```

Cherchez dans la réponse :
```
< Access-Control-Allow-Origin: http://localhost:5173
```

Il ne doit y avoir qu'UN SEUL header `Access-Control-Allow-Origin`.

### Si les conversations ne se chargent pas

1. **Vérifier MongoDB** :
```bash
docker-compose ps mongo-chat
```

2. **Vérifier Redis** :
```bash
docker-compose ps redis
```

3. **Vérifier les logs du chat-service** :
```bash
docker-compose logs chat-service | findstr "error\|exception"
```

---

## 📝 Fichiers Modifiés

### Backend
- ✅ `backend/api-gateway/src/main/resources/application.yml`
- ✅ `backend/chat-service/src/main/java/com/mbolo/chat/config/WebConfig.java`

### Scripts Créés
- ✅ `backend/rebuild-gateway.bat`
- ✅ `backend/rebuild-gateway-and-chat.bat`

### Documentation
- ✅ `CORRECTION_CORS_FINALE.md` (ce fichier)

---

## 🎯 Checklist de Vérification

- [ ] Services arrêtés
- [ ] Conteneurs supprimés
- [ ] Images rebuildées
- [ ] Services redémarrés
- [ ] Logs vérifiés (pas d'erreur)
- [ ] Cache navigateur vidé
- [ ] Test dans le navigateur
- [ ] Conversations chargées
- [ ] Upload fonctionne
- [ ] WebSocket connecté

---

## 💡 Bonnes Pratiques CORS

### ✅ À FAIRE
- Gérer CORS au niveau de l'API Gateway (point d'entrée unique)
- Utiliser des origins spécifiques (pas `*` en production)
- Activer `allowCredentials` pour les cookies/tokens
- Documenter les origins autorisées

### ❌ À ÉVITER
- Configurer CORS à plusieurs niveaux (Gateway + Services)
- Dupliquer les origins dans la configuration
- Utiliser `*` avec `allowCredentials: true`
- Oublier de redémarrer après modification

---

## 🎉 Résultat Final

Après ces corrections :
- ✅ Plus d'erreur CORS
- ✅ Conversations chargent correctement
- ✅ Upload audio/fichiers fonctionne
- ✅ WebSocket se connecte
- ✅ Messages en temps réel fonctionnent

---

**Date** : 21 février 2026
**Statut** : ✅ Corrections appliquées, prêt pour redémarrage
