# Migration vers MongoDB Atlas

## ✅ Ce qui a été fait

Tous les services ont été configurés pour utiliser MongoDB Atlas au lieu des conteneurs MongoDB locaux :

- ✅ `auth-service` → `mbolo_auth` sur Atlas
- ✅ `user-service` → `mbolo_user` sur Atlas  
- ✅ `chat-service` → `mbolo_chat` sur Atlas
- ✅ `post-service` → `mbolo_post` sur Atlas
- ✅ `video-service` → `mbolo_video` sur Atlas
- ✅ `moderation-service` → `mbolo_moderation` sur Atlas

## 🚀 Étapes de migration

### 1. Reconstruire les services

```powershell
cd backend
.\rebuild-services.bat
```

Cette commande va :
- Arrêter tous les services
- Supprimer les anciennes images
- Reconstruire avec la nouvelle configuration Atlas
- Redémarrer tous les services

⏱️ Durée : 5-10 minutes

### 2. Vérifier la connexion

```powershell
.\test-atlas-connection.bat
```

Vous devriez voir dans les logs :
```
Successfully connected to server cluster-dga-1.xylzvke.mongodb.net
```

### 3. Connecter MongoDB Compass

**URI de connexion :**
```
mongodb+srv://devgroupentreprise_db_user:LWC5S7GRgfB2KN84@cluster-dga-1.xylzvke.mongodb.net/
```

1. Ouvrez MongoDB Compass
2. Collez l'URI ci-dessus
3. Cliquez sur "Connect"
4. Vous verrez 6 bases de données : `mbolo_auth`, `mbolo_user`, `mbolo_chat`, `mbolo_post`, `mbolo_video`, `mbolo_moderation`

### 4. Tester avec des données réelles

#### Créer un utilisateur via l'API :

```powershell
curl -X POST http://localhost:8080/api/auth/register -H "Content-Type: application/json" -d "{\"username\":\"testuser\",\"email\":\"test@mbolo.com\",\"password\":\"test123\"}"
```

#### Vérifier dans Compass :
1. Rafraîchissez la base `mbolo_auth`
2. La collection `userAuths` devrait apparaître
3. Vous verrez le document de l'utilisateur créé

#### Créer une vidéo via l'API :

```powershell
# D'abord, se connecter pour obtenir le token
curl -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"testuser\",\"password\":\"test123\"}"

# Puis créer une vidéo (remplacez YOUR_TOKEN)
curl -X POST http://localhost:8080/api/videos -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -d "{\"title\":\"Ma première vidéo\",\"description\":\"Test Atlas\"}"
```

#### Vérifier dans Compass :
1. Rafraîchissez la base `mbolo_video`
2. La collection `videos` devrait apparaître
3. Vous verrez le document de la vidéo créée

## 🔍 Dépannage

### Les services ne démarrent pas

```powershell
# Voir les logs détaillés
docker logs mbolo-auth
docker logs mbolo-video
```

### Erreur de connexion Atlas

Vérifiez que :
1. L'URI Atlas est correcte dans `application-docker.yml`
2. L'IP de votre machine est autorisée dans Atlas (Network Access)
3. Le mot de passe est correct

### Les collections n'apparaissent pas dans Compass

**C'est normal !** MongoDB crée les collections automatiquement lors de la première insertion.

Pour forcer la création :
1. Faites un appel API (register, create post, etc.)
2. Rafraîchissez Compass
3. La collection apparaîtra avec les données

## 📊 Avantages d'Atlas

- ✅ Données persistantes (ne disparaissent pas au redémarrage)
- ✅ Accessible depuis n'importe où
- ✅ Interface web Atlas pour gérer les données
- ✅ Backups automatiques
- ✅ Monitoring intégré
- ✅ Plus besoin des conteneurs MongoDB locaux

## 🗑️ Nettoyage (optionnel)

Si vous voulez supprimer les anciens conteneurs MongoDB locaux :

```powershell
docker-compose down -v
```

Cela supprimera aussi les volumes locaux (les données locales seront perdues, mais vous utilisez Atlas maintenant).
