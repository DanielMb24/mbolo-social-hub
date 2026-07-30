# TODO Backend - Support des images dans les posts

## Problème actuel
Le frontend envoie des images en `multipart/form-data` mais le backend retourne 415 (Unsupported Media Type).

## Solution 1: Accepter multipart/form-data sur /api/posts

### Spring Boot Controller
```java
@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<Post> createPost(
    @RequestParam("content") String content,
    @RequestParam(value = "file", required = false) MultipartFile file
) {
    // Upload file to storage
    String imageUrl = null;
    if (file != null && !file.isEmpty()) {
        imageUrl = fileStorageService.store(file);
    }
    
    // Create post with imageUrl
    Post post = postService.create(content, imageUrl);
    return ResponseEntity.ok(post);
}
```

## Solution 2: Endpoint séparé pour upload

### 1. Upload image
```java
@PostMapping("/api/posts/upload-image")
public ResponseEntity<Map<String, String>> uploadImage(
    @RequestParam("file") MultipartFile file
) {
    String url = fileStorageService.store(file);
    return ResponseEntity.ok(Map.of("url", url));
}
```

### 2. Créer post avec URL
```java
@PostMapping("/api/posts")
public ResponseEntity<Post> createPost(@RequestBody CreatePostRequest request) {
    Post post = postService.create(request.getContent(), request.getImageUrl());
    return ResponseEntity.ok(post);
}
```

## Configuration nécessaire

### application.properties
```properties
spring.servlet.multipart.enabled=true
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
```
