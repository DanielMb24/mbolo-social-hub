# 🚀 Correction Rapide - Servir les Fichiers Uploadés

## 🎯 Objectif
Permettre au backend de servir les fichiers uploadés (images, audio, fichiers) via HTTP.

## ⚡ Solution Rapide (5 minutes)

### Option 1 : Configuration Spring (RECOMMANDÉ - Plus Simple)

#### Étape 1 : Créer la Configuration

**Fichier** : `backend/chat-service/src/main/java/com/mbolo/chat/config/WebConfig.java`

```java
package com.mbolo.chat.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Servir les fichiers du dossier /tmp/uploads/chat via /uploads/chat/**
        registry.addResourceHandler("/uploads/chat/**")
                .addResourceLocations("file:/tmp/uploads/chat/")
                .setCachePeriod(3600) // Cache de 1 heure
                .resourceChain(true);
    }
}
```

#### Étape 2 : Reconstruire et Redémarrer

```bash
cd backend
docker-compose build chat-service
docker-compose up -d chat-service
```

#### Étape 3 : Vérifier

```bash
# Créer un fichier de test
docker-compose exec chat-service sh -c "echo 'test' > /tmp/uploads/chat/test.txt"

# Tester l'accès
curl http://localhost:8080/uploads/chat/test.txt

# Résultat attendu : "test"
```

---

### Option 2 : Endpoint Dédié (Plus de Contrôle)

#### Étape 1 : Ajouter l'Endpoint

**Fichier** : `backend/chat-service/src/main/java/com/mbolo/chat/controller/ChatController.java`

Ajouter ces imports :
```java
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
```

Ajouter cette méthode :
```java
@GetMapping("/uploads/chat/{filename}")
public ResponseEntity<Resource> getFile(@PathVariable String filename) {
    try {
        // Chemin du fichier
        Path filePath = Paths.get("/tmp/uploads/chat").resolve(filename).normalize();
        Resource resource = new UrlResource(filePath.toUri());
        
        // Vérifier que le fichier existe et est lisible
        if (resource.exists() && resource.isReadable()) {
            // Déterminer le type MIME
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }
            
            // Retourner le fichier
            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, 
                    "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    } catch (Exception e) {
        logger.error("Erreur lecture fichier: " + filename, e);
        return ResponseEntity.notFound().build();
    }
}
```

#### Étape 2 : Reconstruire et Redémarrer

```bash
cd backend
docker-compose build chat-service
docker-compose up -d chat-service
```

---

## 🔍 Vérifications

### 1. Vérifier que le Dossier Existe

```bash
docker-compose exec chat-service ls -la /tmp/uploads/chat
```

**Résultat attendu** : Liste des fichiers uploadés

### 2. Vérifier les Permissions

```bash
docker-compose exec chat-service ls -ld /tmp/uploads/chat
```

**Résultat attendu** : `drwxrwxrwx` ou similaire

### 3. Tester l'Accès HTTP

```bash
# Tester avec un fichier existant (remplacer par un vrai UUID)
curl -I http://localhost:8080/uploads/chat/de4925f2-2de5-4764-a380-4de741b62689.jpg
```

**Résultat attendu** : `HTTP/1.1 200 OK`

### 4. Vérifier les Logs

```bash
docker-compose logs -f chat-service | grep -i "upload\|static"
```

---

## 🐛 Résolution de Problèmes

### Problème : 404 Not Found

**Cause possible** : Le fichier n'existe pas

**Solution** :
```bash
# Lister les fichiers
docker-compose exec chat-service ls -la /tmp/uploads/chat

# Vérifier qu'un fichier spécifique existe
docker-compose exec chat-service test -f /tmp/uploads/chat/FILENAME.jpg && echo "Existe" || echo "N'existe pas"
```

### Problème : 403 Forbidden

**Cause possible** : Permissions incorrectes

**Solution** :
```bash
# Corriger les permissions
docker-compose exec chat-service chmod -R 755 /tmp/uploads/chat
```

### Problème : Le Service ne Redémarre Pas

**Solution** :
```bash
# Arrêter complètement
docker-compose stop chat-service

# Supprimer le conteneur
docker-compose rm -f chat-service

# Reconstruire et redémarrer
docker-compose build chat-service
docker-compose up -d chat-service

# Vérifier les logs
docker-compose logs -f chat-service
```

---

## 📝 Configuration Complète (Optionnel)

### application.yml

Ajouter dans `backend/chat-service/src/main/resources/application.yml` :

```yaml
spring:
  servlet:
    multipart:
      max-file-size: 50MB
      max-request-size: 50MB
      enabled: true
  web:
    resources:
      add-mappings: true
      static-locations: file:/tmp/uploads/
```

### CORS (Si Nécessaire)

Si vous avez des problèmes CORS, ajouter dans `WebConfig.java` :

```java
@Override
public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/uploads/**")
            .allowedOrigins("http://localhost:5173", "http://localhost:3000")
            .allowedMethods("GET", "HEAD")
            .allowedHeaders("*")
            .maxAge(3600);
}
```

---

## ✅ Test Complet

### 1. Upload un Fichier

```bash
curl -X POST http://localhost:8080/api/chat/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test-image.jpg" \
  -F "conversationId=conv-123" \
  -F "type=IMAGE"
```

**Réponse attendue** :
```json
{
  "success": true,
  "url": "/uploads/chat/UUID.jpg"
}
```

### 2. Accéder au Fichier

```bash
curl http://localhost:8080/uploads/chat/UUID.jpg --output downloaded.jpg
```

**Résultat** : Le fichier est téléchargé

### 3. Vérifier dans le Navigateur

Ouvrir : `http://localhost:8080/uploads/chat/UUID.jpg`

**Résultat** : L'image s'affiche

---

## 🎯 Résultat Attendu

### Avant
```
❌ GET /uploads/chat/file.jpg → 404 Not Found
❌ Images ne s'affichent pas
❌ Audio ne se lit pas
❌ Erreurs dans la console
```

### Après
```
✅ GET /uploads/chat/file.jpg → 200 OK
✅ Images s'affichent correctement
✅ Audio se lit correctement
✅ Pas d'erreurs 404
✅ Application complètement fonctionnelle
```

---

## 📊 Checklist

- [ ] WebConfig.java créé (Option 1) OU Endpoint ajouté (Option 2)
- [ ] Service reconstruit (`docker-compose build chat-service`)
- [ ] Service redémarré (`docker-compose up -d chat-service`)
- [ ] Dossier /tmp/uploads/chat existe
- [ ] Permissions correctes (755 ou 777)
- [ ] Test curl réussit (HTTP 200)
- [ ] Images s'affichent dans le navigateur
- [ ] Audio se lit dans l'application
- [ ] Pas d'erreurs 404 dans la console

---

## 💡 Recommandations

### Court Terme
1. ✅ Utiliser l'Option 1 (WebConfig) - Plus simple et rapide
2. ✅ Vérifier les permissions du dossier
3. ✅ Tester avec curl avant de tester dans l'app

### Moyen Terme
1. Ajouter un CDN pour les médias (AWS S3, Cloudinary)
2. Implémenter la compression des images
3. Ajouter le cache côté serveur
4. Implémenter le nettoyage automatique des vieux fichiers

### Long Terme
1. Migrer vers un stockage cloud (S3, Azure Blob)
2. Ajouter le streaming pour les gros fichiers
3. Implémenter les thumbnails pour les images
4. Ajouter la transcription pour les audios

---

**Temps estimé** : 5-10 minutes  
**Difficulté** : ⭐ Facile  
**Impact** : 🔥 Critique (bloquant pour les médias)
