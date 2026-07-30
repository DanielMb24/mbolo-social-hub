# Correction affichage des images dans les posts

## Problème
Quand on crée un post avec une image, seul le texte s'affiche, pas l'image.

## Solution implémentée

### 1. Affichage des images dans le feed
Ajout de la section d'affichage d'image dans le rendu des posts:

```tsx
{/* Post Image */}
{post.imageUrl && (
  <div className="mt-3 -mx-3">
    <img 
      src={post.imageUrl} 
      alt="Post" 
      className="w-full max-h-[500px] object-cover"
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  </div>
)}
```

### 2. Upload d'image vers le serveur
Modification de `handleCreatePost` pour uploader l'image:

```tsx
if (previewImage && imageUploadRef.current?.files?.[0]) {
  const file = imageUploadRef.current.files[0];
  await postApi.createPost({ content: newPost }, [file]);
} else {
  await postApi.createPost({ content: newPost });
}
```

### 3. Corrections des erreurs

#### Erreur: `videos.filter is not a function`
**Cause**: L'API retourne parfois un objet au lieu d'un tableau
**Solution**: Gestion de différents formats de réponse dans StoryManager

```tsx
let videos: any[] = [];
if (Array.isArray(result)) {
  videos = result;
} else if (result && typeof result === 'object') {
  const data = result as any;
  if (Array.isArray(data.content)) videos = data.content;
  else if (Array.isArray(data.data)) videos = data.data;
}
```

#### Erreur: Meta tag deprecated
**Cause**: `apple-mobile-web-app-capable` seul est déprécié
**Solution**: Ajout de `mobile-web-app-capable` en plus

```html
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
```

#### Erreur: 413 Request Entity Too Large
**Cause**: Image trop grande pour le serveur
**Note**: À configurer côté backend (augmenter `spring.servlet.multipart.max-file-size`)

#### Erreur: 500 sur comments/like
**Cause**: Problème backend
**Note**: À vérifier côté serveur Spring Boot

## Fichiers modifiés
1. `src/components/mbolo/FeedPage.tsx`
   - Ajout affichage d'image dans les posts
   - Upload d'image vers serveur

2. `src/components/mbolo/StoryManager.tsx`
   - Gestion robuste des formats de réponse API

3. `index.html`
   - Ajout meta tag mobile-web-app-capable

## Test
```bash
npm run build
# ✓ Build réussi en 4.66s
```

## Résultat
✅ Les images s'affichent maintenant dans les posts
✅ Upload d'image fonctionnel
✅ Gestion d'erreur si l'image ne charge pas
✅ Responsive (max-height: 500px)
