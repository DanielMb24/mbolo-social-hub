# Endpoints Manquants à Implémenter

## 1. Indicateur de Frappe (Typing Indicator)

### Endpoint
```
POST /api/chat/conversations/{conversationId}/typing
```

### Description
Envoie un indicateur de frappe aux autres participants de la conversation.

### Implémentation Suggérée

**ChatController.java** :
```java
@PostMapping("/conversations/{conversationId}/typing")
public ResponseEntity<Void> sendTypingIndicator(
    @PathVariable String conversationId,
    @AuthenticationPrincipal UserDetails userDetails
) {
    String userId = userDetails.getUsername();
    
    // Envoyer via WebSocket aux autres participants
    messagingTemplate.convertAndSend(
        "/topic/conversation/" + conversationId,
        Map.of(
            "type", "TYPING",
            "userId", userId,
            "userName", getUserName(userId),
            "timestamp", System.currentTimeMillis()
        )
    );
    
    return ResponseEntity.ok().build();
}
```

### Priorité
**MOYENNE** - Fonctionnalité UX mais non critique

### Workaround Frontend
L'indicateur de frappe est désactivé temporairement dans le frontend pour éviter les erreurs 404.

---

## 2. Serveur de Fichiers Statiques

### Endpoint
```
GET /uploads/chat/{filename}
```

### Description
Sert les fichiers uploadés (images, audio, fichiers).

### Implémentation Suggérée

**ChatController.java** :
```java
@GetMapping("/uploads/chat/{filename}")
public ResponseEntity<Resource> getFile(@PathVariable String filename) {
    try {
        Path filePath = Paths.get("/tmp/uploads/chat").resolve(filename);
        Resource resource = new UrlResource(filePath.toUri());
        
        if (resource.exists() && resource.isReadable()) {
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }
            
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

### Configuration Nécessaire

**application.yml** :
```yaml
spring:
  servlet:
    multipart:
      max-file-size: 50MB
      max-request-size: 50MB
  web:
    resources:
      static-locations: file:/tmp/uploads/
```

### Priorité
**HAUTE** - Nécessaire pour afficher les médias

### Workaround Frontend
Le frontend gère gracieusement les erreurs 404 en affichant "Audio indisponible".

---

## 3. Réactions aux Messages

### Endpoint
```
POST /api/chat/messages/{messageId}/react
```

### Body
```json
{
  "emoji": "👍"
}
```

### Description
Ajoute ou retire une réaction emoji sur un message.

### Implémentation Suggérée

**ChatController.java** :
```java
@PostMapping("/messages/{messageId}/react")
public ResponseEntity<Void> reactToMessage(
    @PathVariable String messageId,
    @RequestBody Map<String, String> request,
    @AuthenticationPrincipal UserDetails userDetails
) {
    String userId = userDetails.getUsername();
    String emoji = request.get("emoji");
    
    chatService.toggleReaction(messageId, userId, emoji);
    
    return ResponseEntity.ok().build();
}
```

**ChatService.java** :
```java
public void toggleReaction(String messageId, String userId, String emoji) {
    Message message = messageRepository.findById(messageId)
        .orElseThrow(() -> new NotFoundException("Message not found"));
    
    // Logique pour ajouter/retirer la réaction
    // ...
    
    messageRepository.save(message);
    
    // Notifier via WebSocket
    messagingTemplate.convertAndSend(
        "/topic/conversation/" + message.getConversationId(),
        Map.of(
            "type", "REACTION",
            "messageId", messageId,
            "userId", userId,
            "emoji", emoji
        )
    );
}
```

### Priorité
**MOYENNE** - Fonctionnalité UX avancée

---

## 4. Messages Favoris

### Endpoint
```
PUT /api/chat/messages/{messageId}/star
```

### Description
Marque ou démarque un message comme favori.

### Implémentation Suggérée

**ChatController.java** :
```java
@PutMapping("/messages/{messageId}/star")
public ResponseEntity<Void> starMessage(
    @PathVariable String messageId,
    @AuthenticationPrincipal UserDetails userDetails
) {
    String userId = userDetails.getUsername();
    chatService.toggleStar(messageId, userId);
    return ResponseEntity.ok().build();
}
```

### Priorité
**BASSE** - Fonctionnalité optionnelle

---

## Résumé des Priorités

| Endpoint | Priorité | Impact | Implémenté Frontend |
|----------|----------|--------|---------------------|
| GET /uploads/chat/{filename} | 🔴 HAUTE | Bloquant pour médias | ✅ Oui |
| POST /conversations/{id}/typing | 🟡 MOYENNE | UX | ✅ Oui (désactivé) |
| POST /messages/{id}/react | 🟡 MOYENNE | UX | ✅ Oui |
| PUT /messages/{id}/star | 🟢 BASSE | Optionnel | ✅ Oui |

## Actions Recommandées

### Immédiat (Priorité Haute)
1. ✅ Implémenter le serveur de fichiers statiques
2. ✅ Vérifier les permissions du dossier /tmp/uploads/chat
3. ✅ Tester l'accès aux fichiers via curl

### Court Terme (Priorité Moyenne)
1. Implémenter l'indicateur de frappe
2. Implémenter les réactions aux messages

### Long Terme (Priorité Basse)
1. Implémenter les messages favoris
2. Ajouter la recherche dans les messages
3. Ajouter l'archivage des conversations

## Tests

### Tester le Serveur de Fichiers
```bash
# Upload un fichier
curl -X POST http://localhost:8080/api/chat/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.webm" \
  -F "conversationId=conv-123" \
  -F "type=AUDIO"

# Récupérer le nom du fichier dans la réponse
# Puis tester l'accès
curl -I http://localhost:8080/uploads/chat/FILENAME.webm
```

### Tester l'Indicateur de Frappe
```bash
curl -X POST http://localhost:8080/api/chat/conversations/conv-123/typing \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Tester les Réactions
```bash
curl -X POST http://localhost:8080/api/chat/messages/msg-123/react \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"emoji":"👍"}'
```
