# Solution temporaire - Posts sans images

## Problème
Le backend ne supporte pas encore `multipart/form-data` sur `/api/posts`, ce qui cause l'erreur 415.

## Solution temporaire implémentée

Les posts sont créés SANS images pour l'instant. L'utilisateur peut:
- ✅ Écrire du texte
- ✅ Sélectionner une image (preview s'affiche)
- ✅ Publier le post
- ⚠️ L'image n'est PAS uploadée (message d'avertissement)

### Code
```tsx
// Pour l'instant, créer le post sans image
await postApi.createPost({ content: newPost });

if (selectedImageFile) {
  toast.success("Post publié (image non supportée pour l'instant)");
} else {
  toast.success("Post publié avec succès");
}
```

## Ce qu'il faut faire côté backend

Voir le fichier `BACKEND_TODO_IMAGES.md` pour les détails complets.

### Option 1: Accepter multipart sur /api/posts
```java
@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<Post> createPost(
    @RequestParam("content") String content,
    @RequestParam(value = "file", required = false) MultipartFile file
)
```

### Option 2: Endpoint séparé
1. `POST /api/posts/upload-image` → retourne URL
2. `POST /api/posts` avec `{content, imageUrl}`

## Quand le backend sera prêt

Décommenter dans FeedPage.tsx:
```tsx
if (selectedImageFile) {
  await postApi.createPost({ content: newPost }, [selectedImageFile]);
} else {
  await postApi.createPost({ content: newPost });
}
```

## Test
```bash
npm run build
# ✓ Build réussi en 4.56s
```
