# 🎨 Guide de Design MBolo

## Palette de Couleurs

### Mode Clair
```css
--primary: #3b82f6        /* Bleu moderne */
--background: #ffffff     /* Blanc pur */
--card: #ffffff          /* Blanc pur */
--muted: #f3f4f6         /* Gris très clair */
--border: #e5e7eb        /* Gris clair */
--foreground: #1a1f2e    /* Gris très foncé */
```

### Mode Sombre
```css
--primary: #60a5fa        /* Bleu clair */
--background: #1a1f2e     /* Gris très foncé */
--card: #242b3d          /* Gris foncé */
--muted: #2d3548         /* Gris moyen */
--border: #2d3548        /* Gris moyen */
--foreground: #f9fafb    /* Blanc cassé */
```

## Icônes vs Emojis

### ❌ Avant (Emojis)
```tsx
<span>🔥</span> Se connecter
<span>🚀</span> Créer mon compte
<span>✅</span> Connexion réussie
<span>❌</span> Erreur
<span>👍</span> J'aime
<span>❤️</span> Adore
<span>😂</span> Haha
<span>🗑️</span> Supprimer
<span>🚩</span> Signaler
<span>🔗</span> Lien copié
<span>🌐</span> Public
```

### ✅ Après (Icônes Lucide)
```tsx
<CheckCircle /> Se connecter
<Sparkles /> Créer mon compte
toast.success("Connexion réussie")
toast.error("Erreur")
<ThumbsUp /> J'aime
<Heart /> Adore
<Laugh /> Haha
<Trash2 /> Supprimer
<Flag /> Signaler
<Link2 /> Lien copié
<Globe /> Public
```

## Composants Principaux

### Bouton Primaire
```tsx
// Avant
<button className="btn-gradient-orange">
  <span>🔥</span> Action
</button>

// Après
<button className="btn-primary">
  <CheckCircle className="w-5 h-5" />
  Action
</button>
```

### Input Moderne
```tsx
// Avant
<input className="w-full px-4 py-3 rounded-xl border-2 border-border" />

// Après
<input className="input-modern" />
```

### Card
```tsx
// Avant
<div className="bg-card rounded-2xl shadow-2xl p-8">

// Après
<div className="card-modern">
```

## Animations

### Transitions
```css
/* Avant: 300ms */
transition-all duration-300

/* Après: 200ms */
transition-all duration-200
```

### Animations Personnalisées
```css
/* Slide in (sidebar mobile) */
.animate-slide-in-left {
  animation: slide-in-left 0.2s ease-out;
}

/* Fade in (éléments) */
.animate-fade-in {
  animation: fade-in 0.2s ease-out;
}
```

## Espacements

### Padding
- `p-2` = 8px (petits éléments)
- `p-3` = 12px (éléments moyens)
- `p-4` = 16px (grands éléments)

### Gap
- `gap-2` = 8px (icône + texte)
- `gap-3` = 12px (éléments de liste)
- `gap-4` = 16px (sections)

### Radius
- `rounded-lg` = 8px (boutons, inputs)
- `rounded-xl` = 12px (cards)
- `rounded-full` = 9999px (avatars, badges)

## Typographie

### Tailles
- `text-xs` = 12px (timestamps, labels)
- `text-sm` = 14px (corps de texte)
- `text-base` = 16px (titres secondaires)
- `text-lg` = 18px (titres principaux)
- `text-xl` = 20px (grands titres)

### Poids
- `font-normal` = 400 (texte normal)
- `font-medium` = 500 (labels)
- `font-semibold` = 600 (boutons)
- `font-bold` = 700 (titres)

## Exemples de Composants

### Post Card
```tsx
<article className="bg-card rounded-xl border shadow-sm">
  {/* Header */}
  <div className="flex items-center gap-3 p-3">
    <div className="w-10 h-10 rounded-full bg-primary">
      {initials}
    </div>
    <div className="flex-1">
      <span className="font-bold text-sm">{name}</span>
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        {formatTimeAgo(date)} · <Globe className="w-3 h-3" />
      </span>
    </div>
  </div>
  
  {/* Content */}
  <div className="px-3 pb-2">
    <p className="text-sm">{content}</p>
  </div>
  
  {/* Actions */}
  <div className="border-t flex items-center px-1 py-0.5">
    <button className="flex-1 flex items-center justify-center gap-2 py-2.5">
      <ThumbsUp className="w-5 h-5" />
      J'aime
    </button>
  </div>
</article>
```

### Input avec Icône
```tsx
<div className="relative">
  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
  <input 
    className="input-modern pl-10" 
    placeholder="Nom d'utilisateur"
  />
</div>
```

### Toast Notification
```tsx
// Avant
toast({ 
  title: "✅ Succès", 
  description: "Action réussie" 
});

// Après
toast.success("Action réussie");
toast.error("Une erreur est survenue");
toast.info("Information importante");
```

## Responsive Design

### Breakpoints
- `sm:` = 640px (mobile large)
- `md:` = 768px (tablette)
- `lg:` = 1024px (desktop)
- `xl:` = 1280px (large desktop)

### Exemple
```tsx
<div className="
  w-full           /* Mobile: pleine largeur */
  sm:w-auto        /* Mobile large: auto */
  lg:w-[280px]     /* Desktop: largeur fixe */
">
```

## Accessibilité

### Contraste
- Texte principal: ratio 7:1 (AAA)
- Texte secondaire: ratio 4.5:1 (AA)
- Icônes: ratio 3:1 (AA)

### Focus
```css
focus:outline-none 
focus:ring-2 
focus:ring-primary/20
```

### Aria Labels
```tsx
<button aria-label="J'aime ce post">
  <ThumbsUp className="w-5 h-5" />
</button>
```

## Performance

### Lazy Loading
```tsx
const ChatPage = lazy(() => import("./ChatPage"));
```

### Optimistic Updates
```tsx
// Update UI immédiatement
setPosts(prev => updateLikes(prev, postId));

// Puis sync avec API
await postApi.likePost(postId);
```

### Memoization
```tsx
const handleLike = useCallback(async (id) => {
  // ...
}, [posts, userId]);
```

## Bonnes Pratiques

### ✅ À Faire
- Utiliser les icônes Lucide React
- Utiliser les classes utilitaires (btn-primary, input-modern)
- Utiliser formatTimeAgo() pour les dates
- Utiliser getInitials() pour les avatars
- Utiliser toast.success/error pour les notifications
- Utiliser useCallback pour les handlers
- Utiliser lazy() pour les pages

### ❌ À Éviter
- Emojis dans le code
- Styles inline
- Couleurs hardcodées
- Fonctions de formatage dupliquées
- Re-renders inutiles
- Bundles trop gros

## Checklist Design

Avant de commit:
- [ ] Aucun emoji dans le code
- [ ] Icônes Lucide utilisées
- [ ] Palette de couleurs respectée
- [ ] Classes utilitaires utilisées
- [ ] Animations optimisées (200ms)
- [ ] Responsive testé
- [ ] Accessibilité vérifiée
- [ ] Performance optimisée

## Ressources

- **Icônes**: https://lucide.dev
- **Couleurs**: https://tailwindcss.com/docs/customizing-colors
- **Composants**: https://ui.shadcn.com
- **Animations**: https://tailwindcss.com/docs/animation
