# 📜 Scripts MBolo Social Hub

Ce dossier contient tous les scripts utilitaires pour le projet.

## 📁 Structure

```
scripts/
├── backend/          # Scripts pour gérer le backend
└── README.md         # Ce fichier
```

## 🔧 Scripts Backend

### Déploiement & Build

- **rebuild-gateway.bat** - Rebuild l'API Gateway
- **rebuild-chat-service.bat** - Rebuild le service de chat
- **rebuild-gateway-and-chat.bat** - Rebuild les deux services
- **rebuild-services.bat** - Rebuild tous les services
- **restart-services.bat** - Redémarrer tous les services

### Initialisation

- **init-databases.bat/.sh** - Initialiser les bases de données MongoDB
- **init-minio.bat/.sh** - Initialiser MinIO (stockage de fichiers)
- **seed-test-data.bat/.sh** - Insérer des données de test

### Tests

- **test-api-direct.bat** - Tester l'API directement
- **test-post-api.bat** - Tester l'API des posts
- **test-mongodb-write.bat** - Tester l'écriture MongoDB
- **test-email-config.bat** - Tester la configuration email
- **quick-test.bat** - Test rapide de tous les services

### Vérification

- **check-services.bat** - Vérifier l'état des services
- **check-mongodb.bat** - Vérifier MongoDB
- **verify-databases.bat/.sh** - Vérifier toutes les bases de données
- **diagnose-problem.bat** - Diagnostiquer les problèmes

### Maintenance

- **clean-orphan-media.bat** - Nettoyer les médias orphelins
- **clean-orphan-posts.bat** - Nettoyer les posts orphelins
- **fix-collections.bat** - Réparer les collections MongoDB
- **verifier-uploads.bat** - Vérifier les uploads

## 🚀 Utilisation

### Windows

```bash
cd scripts/backend
.\rebuild-chat-service.bat
```

### Linux/Mac

```bash
cd scripts/backend
chmod +x rebuild-chat-service.sh
./rebuild-chat-service.sh
```

## 💡 Conseils

1. **Toujours exécuter depuis le dossier scripts/backend**
2. **Vérifier les logs** après chaque script
3. **Lire les commentaires** dans chaque script pour comprendre ce qu'il fait

## 🆘 Problèmes Courants

### Script ne s'exécute pas (PowerShell)

```powershell
# Utiliser .\ devant le nom
.\rebuild-chat-service.bat
```

### Permission denied (Linux/Mac)

```bash
# Rendre le script exécutable
chmod +x script-name.sh
```

## 📚 Documentation

Pour plus d'informations, consultez la documentation principale du projet.
