# ✅ Corrections Backend Appliquées

## 📋 Résumé

Toutes les corrections nécessaires ont été appliquées au backend pour résoudre les erreurs d'upload et de WebSocket.

---

## 🔧 Corrections Appliquées

### 1. Configuration CORS - Chat Service

**Fichier** : `backend/chat-service/src/main/java/com/mbolo/chat/config/WebConfig.java`

**Problème** : L'endpoint `/api/chat/upload` n'était pas couvert par la configuration CORS

**Solution** : Ajout d'une configuration CORS pour `/api/chat/**`

```java
// Permettre l'accès CORS à l'API de chat (pour upload)
registry.addMapping("/api/chat/**")
        .allowedOrigins("http://localhost:5173", "http://localhost:3000", "http://localhost:8080")
        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
        .allowedHeaders("*")
        .allowCredentials(true)
        .maxAge(3600);
```

---

### 2. Configuration Multipart - application.yml

**Fichier** : `backend/chat-service/src/main/resources/application.yml`

**Problème** : Pas de configuration pour les uploads multipart

**Solution** : Ajout de la configuration multipart

```yaml
spring:
  servlet:
    multipart:
      enabled: true
      max-file-size: 50MB
      max-request-size: 50MB
      file-size-threshold: 2KB
```

**Limites configurées** :
- Images : jusqu'à 50MB
- Audio : jusqu'à 50MB
- Fichiers : jusqu'à 50MB

---

### 3. Configuration Multipart - application-docker.yml

**Fichier** : `backend/chat-service/src/main/resources/application-docker.yml`

**Problème** : Même configuration manquante pour Docker

**Solution** : Ajout de la même configuration multipart

---

### 4. Script de Rebuild

**Fichier** : `backend/rebuild-chat-service.bat`

**Utilité** : Script pour reconstruire et redémarrer le chat-service facilement

**Commandes** :
```bash
cd backend
rebuild-chat-service.bat
```

---

## ✅ Vérifications Effectuées

### Configuration Existante (Déjà Correcte)

1. ✅ **API Gateway - JwtAuthFilter**
   - Extrait correctement le `userId` du JWT
   - Ajoute le header `X-User-Id`
   - Code déjà correct, pas de modification nécessaire

2. ✅ **WebSocket Configuration**
   - CORS déjà configuré avec `setAllowedOriginPatterns("*")`
   - Pas de modification nécessaire

3. ✅ **Routes API Gateway**
   - Routes correctement configurées pour `/api/chat/**`
   - Pas de modification nécessaire

4. ✅ **ChatService.uploadFile()**
   - Méthode d'upload correctement implémentée
   - Sauvegarde dans `/tmp/uploads/chat/`
   - Retourne l'URL correcte

---

## 🚀 Déploiement des Corrections

### Étape 1 : Rebuild du Chat Service

```bash
cd backend
rebuild-chat-service.bat
```

Ou manuellement :
```bash
cd backend
docker-compose stop chat-service
docker-compose rm -f chat-service
docker-compose build --no-cache chat-service
docker-compose up -d chat-service
```

### Étape 2 : Vérifier les Logs

```bash
docker-compose logs -f chat-service
```

Recherchez :
- `Started ChatServiceApplication` - Service démarré
- Pas d'erreurs de configuration
- Pas d'erreurs de connexion MongoDB/Redis

### Étape 3 : Tester l'Upload

#### Test avec curl

```bash
# Obtenir un token
TOKEN="votre_token_jwt"

# Tester upload image
curl -X POST http://localhost:8080/api/chat/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.jpg" \
  -F "conversationId=123" \
  -F "type=IMAGE"
```

#### Test depuis l'Application

1. Ouvrir http://localhost:5173
2. Se connecter
3. Ouvrir une conversation
4. Tester :
   - Upload d'image (bouton image)
   - Upload de fichier (bouton trombone)
   - Enregistrement audio (bouton micro)

---

## 🧪 Tests à Effectuer

### Test 1 : Upload Image
- [ ] Sélectionner une image
- [ ] Vérifier l'envoi sans erreur 400
- [ ] Vérifier l'affichage dans la conversation
- [ ] Vérifier l'URL de l'image

### Test 2 : Upload Audio
- [ ] Enregistrer un message audio
- [ ] Vérifier l'envoi sans erreur 400
- [ ] Vérifier le player audio dans la conversation
- [ ] Vérifier la lecture de l'audio

### Test 3 : Upload Fichier
- [ ] Sélectionner un fichier (PDF, DOC, etc.)
- [ ] Vérifier l'envoi sans erreur 400
- [ ] Vérifier l'affichage du lien
- [ ] Vérifier le téléchargement

### Test 4 : WebSocket
- [ ] Ouvrir deux navigateurs
- [ ] Se connecter avec deux comptes
- [ ] Envoyer un message
- [ ] Vérifier réception en temps réel
- [ ] Pas d'erreur CORS dans la console

---

## 📊 Résultats Attendus

### Avant Corrections
```
❌ POST http://localhost:8080/api/chat/upload 400 (Bad Request)
❌ Access to XMLHttpRequest blocked by CORS policy
❌ Erreur upload audio: Error: Erreur lors de l'upload
❌ Erreur upload fichier: Error: Erreur lors de l'upload
```

### Après Corrections
```
✅ POST http://localhost:8080/api/chat/upload 200 (OK)
✅ Response: {success: true, url: "/uploads/chat/xxx.jpg"}
✅ Message audio envoyé
✅ Image envoyée
✅ WebSocket connecté sans erreur
```

---

## 🔍 Dépannage

### Si l'erreur 400 persiste

1. **Vérifier que le service est bien redémarré** :
```bash
docker-compose ps chat-service
```

2. **Vérifier les logs** :
```bash
docker-compose logs chat-service | grep -i "error\|exception"
```

3. **Vérifier le token JWT** :
```bash
# Dans la console du navigateur
console.log(localStorage.getItem('token'))
```

4. **Vérifier le header X-User-Id** :
```bash
# Activer les logs dans JwtAuthFilter
# Ajouter : logger.info("X-User-Id: " + userId);
```

### Si le WebSocket ne se connecte pas

1. **Vérifier que Redis fonctionne** :
```bash
docker-compose ps redis
```

2. **Vérifier la connexion MongoDB** :
```bash
docker-compose logs chat-service | grep -i "mongodb"
```

3. **Tester la connexion directe** :
```bash
curl http://localhost:8083/ws-chat/info
```

### Si les fichiers ne s'affichent pas

1. **Vérifier le dossier uploads** :
```bash
docker exec mbolo-chat ls -la /tmp/uploads/chat/
```

2. **Vérifier les permissions** :
```bash
docker exec mbolo-chat chmod -R 755 /tmp/uploads/chat/
```

3. **Vérifier l'URL retournée** :
```bash
# Doit être : /uploads/chat/xxx.jpg
# Pas : /tmp/uploads/chat/xxx.jpg
```

---

## 📝 Notes Importantes

### Sécurité

1. **Validation des fichiers** : Ajouter validation MIME type côté backend
2. **Scan antivirus** : Recommandé pour la production
3. **Limite de taille** : 50MB configuré, ajustable selon besoins

### Performance

1. **Compression** : Implémenter compression images côté backend
2. **CDN** : Utiliser un CDN pour les fichiers en production
3. **Nettoyage** : Implémenter suppression des fichiers orphelins

### Production

1. **Stockage** : Utiliser S3/MinIO au lieu du système de fichiers local
2. **Backup** : Sauvegarder régulièrement les uploads
3. **Monitoring** : Surveiller l'espace disque

---

## ✅ Checklist Finale

- [x] Configuration CORS ajoutée
- [x] Configuration multipart ajoutée
- [x] Script de rebuild créé
- [ ] Service redémarré
- [ ] Tests effectués
- [ ] Erreurs résolues

---

## 🎉 Conclusion

Toutes les corrections backend ont été appliquées. Après redémarrage du chat-service, les uploads audio/fichiers/images devraient fonctionner correctement.

**Prochaine étape** : Redémarrer le service et tester !

```bash
cd backend
rebuild-chat-service.bat
```

---

**Date** : 21 février 2026
**Statut** : ✅ Corrections appliquées, en attente de redémarrage
