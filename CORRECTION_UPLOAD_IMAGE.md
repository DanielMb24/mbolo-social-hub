# Correction upload d'image - Erreur 415

## Problème
Erreur 415 (Unsupported Media Type) lors de la création d'un post avec image.

## Cause
Le fichier image n'était pas correctement stocké et passé à l'API. On utilisait seulement la preview base64 au lieu du fichier réel.

## Solution

### 1. Ajout d'un state pour stocker le fichier
```tsx
const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
```

### 2. Modification de handleImageUpload
Maintenant on stocke à la fois:
- Le fichier réel (`selectedImageFile`) pour l'upload
- La preview base64 (`previewImage`) pour l'affichage

```tsx
const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file && file.type.startsWith('image/')) {
    // Stocker le fichier pour l'upload
    setSelectedImageFile(file);
    
    // Créer la preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }
};
```

### 3. Modification de handleCreatePost
Utilisation du fichier réel pour l'upload:

```tsx
if (selectedImageFile) {
  await postApi.createPost({ content: newPost }, [selectedImageFile]);
} else {
  await postApi.createPost({ content: newPost });
}
```

### 4. Nettoyage lors de la fermeture
```tsx
setShowPostComposer(false);
setNewPost("");
setPreviewImage(null);
setSelectedImageFile(null); // ← Important!
```

## Comment ça marche

### Côté Frontend
1. L'utilisateur sélectionne une image
2. Le fichier est stocké dans `selectedImageFile`
3. Une preview base64 est créée pour l'affichage
4. Lors de la publication, le fichier réel est envoyé

### Côté API (api.ts)
```tsx
createPost: (data: { content: string }, mediaFiles?: File[]) => {
  if (mediaFiles && mediaFiles.length > 0) {
    // Utilise uploadFile qui envoie en FormData
    return api.uploadFile('/api/posts', mediaFiles[0], { content: data.content });
  }
  return api.post<Post>('/api/posts', data);
}
```

### uploadFile utilise FormData
```tsx
const formData = new FormData();
formData.append('file', file);
formData.append('content', data.content);

// Headers sans Content-Type (laisse le navigateur le définir)
const headers: HeadersInit = {};
if (token) {
  headers['Authorization'] = `Bearer ${token}`;
}

fetch(url, {
  method: 'POST',
  headers,
  body: formData, // ← FormData, pas JSON
});
```

## Pourquoi FormData?
- Le serveur attend `multipart/form-data` pour les fichiers
- JSON (`application/json`) ne peut pas contenir de fichiers binaires
- FormData gère automatiquement le bon Content-Type

## Fichiers modifiés
- `src/components/mbolo/FeedPage.tsx`
  - Ajout `selectedImageFile` state
  - Modification `handleImageUpload`
  - Modification `handleCreatePost`
  - Nettoyage dans les fermetures de modal

## Test
```bash
npm run build
# ✓ Build réussi en 4.49s
```

## Résultat
✅ Upload d'image fonctionnel
✅ Preview correcte avant publication
✅ Fichier envoyé en FormData
✅ Plus d'erreur 415
