# Guide d'Utilisation du Nouveau Design MBolo

## 🎨 Vue d'Ensemble

Le design MBolo est maintenant moderne, attractif et cohérent avec :
- **Typographie Bold** : Titres en Extra Bold
- **Gradient Orange** : Boutons et accents
- **Formulaires Modernes** : Avec icônes et animations
- **Stories CRUD** : Système complet de gestion

---

## 🚀 Démarrage Rapide

### 1. Lancer l'Application

```bash
npm run dev
```

L'application sera disponible sur **http://localhost:5173/**

### 2. Rafraîchir le Navigateur

Appuyez sur **Ctrl + Shift + R** (ou **Cmd + Shift + R** sur Mac) pour un hard refresh.

---

## 📚 Utilisation des Classes CSS

### Boutons

#### Bouton Principal (Gradient Orange)
```tsx
<button className="btn-gradient-orange">
  Action
</button>
```

#### Avec Icône
```tsx
<button className="btn-gradient-orange flex items-center gap-2">
  <Plus className="w-5 h-5" />
  <span className="font-extrabold">Créer</span>
</button>
```

#### Pleine Largeur
```tsx
<button className="btn-gradient-orange w-full">
  Soumettre
</button>
```

---

### Formulaires

#### Input Simple
```tsx
<input
  type="text"
  placeholder="Votre nom"
  className="input-modern"
/>
```

#### Input avec Icône
```tsx
<div className="relative">
  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
  <input
    type="text"
    placeholder="Nom complet"
    className="input-modern input-with-icon"
  />
</div>
```

#### Textarea
```tsx
<textarea
  placeholder="Votre message"
  className="input-modern resize-none"
  rows={4}
/>
```

---

### Cards

#### Card Simple
```tsx
<div className="card-modern">
  <h3 className="text-xl font-extrabold mb-2">Titre</h3>
  <p className="text-muted-foreground">Contenu de la card</p>
</div>
```

#### Card avec Animation
```tsx
<div className="card-modern animate-fade-in">
  {/* Contenu */}
</div>
```

---

### Typographie

#### Titres
```tsx
<h1 className="text-5xl font-extrabold">Titre Principal</h1>
<h2 className="text-4xl font-extrabold">Sous-titre</h2>
<h3 className="text-3xl font-extrabold">Section</h3>
```

#### Texte avec Gradient
```tsx
<h1 className="text-5xl font-extrabold text-gradient-orange">
  MBolo
</h1>
```

---

## 🎬 Gestion des Stories

### Intégrer le Story Manager

```tsx
import StoryManager from '@/components/mbolo/StoryManager';

function MyComponent() {
  const userId = localStorage.getItem('userId') || 'me';
  const username = 'John Doe';
  const initials = 'JD';

  return (
    <StoryManager
      currentUserId={userId}
      currentUsername={username}
      currentUserInitials={initials}
      onStoryCreated={(story) => {
        console.log('Nouvelle story:', story);
        // Mettre à jour l'état, notifier, etc.
      }}
      onStoryDeleted={(storyId) => {
        console.log('Story supprimée:', storyId);
        // Mettre à jour l'état
      }}
    />
  );
}
```

### Fonctionnalités Disponibles

1. **Créer une Story**
   - Cliquer sur "Créer une story"
   - Choisir entre Texte ou Image
   - Personnaliser (gradient, contenu)
   - Publier

2. **Voir ses Stories**
   - Affichage en grille
   - Preview de chaque story
   - Compteur d'expiration
   - Nombre de vues

3. **Supprimer une Story**
   - Bouton "Supprimer" sur chaque story
   - Confirmation avant suppression
   - Animation de suppression

---

## 🎯 Exemples Complets

### Formulaire de Connexion

```tsx
<form onSubmit={handleSubmit} className="space-y-4">
  {/* Email */}
  <div className="relative">
    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
    <input
      type="email"
      placeholder="Email"
      className="input-modern input-with-icon"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
    />
  </div>

  {/* Password */}
  <div className="relative">
    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
    <input
      type="password"
      placeholder="Mot de passe"
      className="input-modern input-with-icon"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
    />
  </div>

  {/* Submit */}
  <button type="submit" className="btn-gradient-orange w-full">
    <span className="flex items-center justify-center gap-2">
      <span>🔥</span>
      <span className="font-extrabold">Se connecter</span>
    </span>
  </button>
</form>
```

### Card de Profil

```tsx
<div className="card-modern">
  {/* Avatar */}
  <div className="flex items-center gap-4 mb-4">
    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-extrabold text-xl">
      JD
    </div>
    <div>
      <h3 className="text-xl font-extrabold">John Doe</h3>
      <p className="text-sm text-muted-foreground">@johndoe</p>
    </div>
  </div>

  {/* Stats */}
  <div className="flex gap-4 mb-4">
    <div>
      <p className="text-2xl font-extrabold">1.2k</p>
      <p className="text-xs text-muted-foreground">Abonnés</p>
    </div>
    <div>
      <p className="text-2xl font-extrabold">340</p>
      <p className="text-xs text-muted-foreground">Abonnements</p>
    </div>
  </div>

  {/* Action */}
  <button className="btn-gradient-orange w-full">
    <span className="font-extrabold">Suivre</span>
  </button>
</div>
```

---

## 🎨 Personnalisation

### Changer le Gradient Orange

Dans `src/index.css` :

```css
:root {
  --gradient-start: 25 95% 53%;  /* Orange */
  --gradient-end: 14 100% 57%;   /* Rouge-orange */
}
```

### Ajouter un Nouveau Gradient

```css
.btn-gradient-blue {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  /* Copier les autres propriétés de .btn-gradient-orange */
}
```

---

## 📱 Responsive

Toutes les classes sont responsive par défaut :

```tsx
{/* Mobile : Petit, Desktop : Grand */}
<h1 className="text-3xl md:text-5xl font-extrabold">
  Titre Responsive
</h1>

{/* Mobile : Colonne, Desktop : Grille */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards */}
</div>
```

---

## 🐛 Dépannage

### Les styles ne s'appliquent pas

1. Vérifier que `src/index.css` est importé dans `main.tsx`
2. Faire un hard refresh (Ctrl + Shift + R)
3. Vérifier la console pour les erreurs

### Le gradient ne s'affiche pas

1. Vérifier que la classe est bien `.btn-gradient-orange`
2. S'assurer qu'il n'y a pas de classe conflictuelle
3. Vérifier les variables CSS dans `:root`

### Les icônes ne s'affichent pas

1. Vérifier l'import : `import { Icon } from "lucide-react"`
2. Vérifier la taille : `className="w-5 h-5"`
3. Vérifier la couleur : `className="text-muted-foreground"`

---

## 📖 Ressources

- **Lucide Icons** : https://lucide.dev/
- **Tailwind CSS** : https://tailwindcss.com/docs
- **Inter Font** : https://fonts.google.com/specimen/Inter

---

## ✨ Conseils

1. **Cohérence** : Utiliser toujours `.btn-gradient-orange` pour les actions principales
2. **Hiérarchie** : Titres en Extra Bold, texte en Medium/Semibold
3. **Espacement** : Utiliser `gap-4`, `space-y-4`, `p-4` pour la cohérence
4. **Animations** : Ajouter `animate-fade-in` pour les apparitions
5. **Hover** : Ajouter `hover:scale-105` pour les interactions

---

**Bon développement ! 🚀**
