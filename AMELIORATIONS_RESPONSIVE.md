# Améliorations Responsivité & Design

## Changements effectués

### 1. Palette de couleurs simplifiée (moins de bleu)
- **Avant**: Bleu dominant partout (#3b82f6)
- **Après**: 
  - Primary: Noir/Gris foncé (neutre)
  - Accent: Bleu utilisé uniquement pour les actions importantes
  - Meilleure visibilité et contraste

### 2. Upload de photos corrigé
- **Avatar**: Fonctionne maintenant avec `userApi.uploadAvatar()`
- **Couverture**: Nouveau endpoint `userApi.uploadCover()` ajouté
- Validation: Type image + max 5MB
- Rechargement automatique du profil après upload

### 3. Responsivité mobile améliorée

#### ProfilePage
- Hauteur cover adaptative: 32px (mobile) → 48px (desktop)
- Avatar: 20px → 28px selon écran
- Boutons compacts sur mobile
- Tabs avec scroll horizontal
- Textes et espacements réduits sur petit écran
- Icônes seules sur mobile, labels sur desktop

#### AuthPage
- Panel gauche réduit sur mobile (250px min-height)
- Illustration SVG cachée sur très petit écran
- Formulaires avec espacement adaptatif
- Inputs et boutons plus petits sur mobile
- Logo et titre responsive

### 4. Composants CSS améliorés
```css
.btn-primary - Bouton noir/gris
.btn-accent - Bouton bleu pour actions importantes
.input-modern - Input avec meilleur focus
.card-modern - Card avec ombre légère
```

### 5. Breakpoints utilisés
- `sm:` 640px - Téléphones en paysage
- `lg:` 1024px - Desktop

## Fichiers modifiés
- `src/index.css` - Palette de couleurs + composants
- `src/lib/api.ts` - Ajout uploadCover()
- `src/components/mbolo/ProfilePage.tsx` - Responsive + upload
- `src/components/mbolo/AuthPage.tsx` - Responsive complet

## Test
```bash
npm run build
# ✓ Build réussi en 9.86s
```
