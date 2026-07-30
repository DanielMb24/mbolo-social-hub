# 📝 Commandes Utiles MBolo

## Développement

### Démarrer le serveur de développement
```bash
npm run dev
```
Ouvre l'application sur http://localhost:5173

### Build de production
```bash
npm run build
```
Crée le build optimisé dans `/dist`

### Prévisualiser le build
```bash
npm run preview
```
Prévisualise le build de production localement

### Linter
```bash
npm run lint
```
Vérifie le code avec ESLint

### Tests
```bash
npm run test        # Run tests once
npm run test:watch  # Watch mode
```

## Build Android (Capacitor)

### Synchroniser avec Android
```bash
npx cap sync android
```

### Ouvrir dans Android Studio
```bash
npx cap open android
```

### Build Android
```bash
cd android
./gradlew assembleDebug
```

## Optimisations

### Analyser le bundle
```bash
npm run build -- --mode analyze
```

### Mettre à jour les dépendances
```bash
npm update
```

### Nettoyer le cache
```bash
rm -rf node_modules dist .vite
npm install
```

## Git

### Commit avec message
```bash
git add .
git commit -m "feat: optimisations performance et design"
git push
```

### Créer une branche
```bash
git checkout -b feature/nom-feature
```

### Merge
```bash
git checkout main
git merge feature/nom-feature
```

## Déploiement

### Netlify
```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

### Vercel
```bash
# Installer Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Render
```bash
# Build command
npm run build

# Publish directory
dist
```

## Maintenance

### Vérifier les vulnérabilités
```bash
npm audit
npm audit fix
```

### Mettre à jour browserslist
```bash
npx update-browserslist-db@latest
```

### Nettoyer les fichiers inutilisés
```bash
# Trouver les imports non utilisés
npx depcheck

# Supprimer les dépendances inutilisées
npm prune
```

## Performance

### Lighthouse
```bash
# Installer Lighthouse
npm install -g lighthouse

# Analyser
lighthouse http://localhost:5173 --view
```

### Bundle Analyzer
```bash
# Installer
npm install -D rollup-plugin-visualizer

# Ajouter dans vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

plugins: [
  visualizer({ open: true })
]
```

## Base de données (si applicable)

### Migrations Prisma
```bash
npx prisma migrate dev
npx prisma generate
npx prisma studio
```

### MongoDB
```bash
# Connexion
mongosh "mongodb://localhost:27017/mbolo"

# Backup
mongodump --db mbolo --out backup/

# Restore
mongorestore --db mbolo backup/mbolo/
```

## Docker (optionnel)

### Build image
```bash
docker build -t mbolo-app .
```

### Run container
```bash
docker run -p 5173:5173 mbolo-app
```

### Docker Compose
```bash
docker-compose up -d
docker-compose down
```

## Utilitaires

### Formater le code
```bash
# Installer Prettier
npm install -D prettier

# Formater
npx prettier --write "src/**/*.{ts,tsx,css}"
```

### Générer des composants
```bash
# Créer un nouveau composant
mkdir src/components/mbolo/NewComponent
touch src/components/mbolo/NewComponent.tsx
```

### Vérifier les types TypeScript
```bash
npx tsc --noEmit
```

## Environnement

### Variables d'environnement
```bash
# Créer .env.local
cp .env.example .env.local

# Éditer les variables
nano .env.local
```

### Modes
```bash
# Development
npm run dev

# Production
npm run build

# Staging
npm run build -- --mode staging
```

## Monitoring

### Logs en production
```bash
# Installer Sentry
npm install @sentry/react

# Configurer dans main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_DSN",
  environment: "production"
});
```

### Analytics
```bash
# Installer Plausible
npm install plausible-tracker

# Utiliser
import Plausible from 'plausible-tracker';
const plausible = Plausible();
plausible.trackPageview();
```

## Troubleshooting

### Port déjà utilisé
```bash
# Trouver le processus
netstat -ano | findstr :5173

# Tuer le processus
taskkill /PID <PID> /F
```

### Erreur de cache
```bash
rm -rf node_modules/.vite
npm run dev
```

### Erreur TypeScript
```bash
# Redémarrer le serveur TypeScript
# Dans VSCode: Ctrl+Shift+P > "TypeScript: Restart TS Server"
```

### Erreur de build
```bash
# Nettoyer et rebuild
rm -rf dist node_modules
npm install
npm run build
```

## Scripts Personnalisés

### Ajouter dans package.json
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "test": "vitest run",
    "test:watch": "vitest",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
    "type-check": "tsc --noEmit",
    "analyze": "vite build --mode analyze"
  }
}
```

## Checklist Avant Déploiement

- [ ] `npm run build` réussit
- [ ] `npm run lint` sans erreurs
- [ ] `npm run test` tous les tests passent
- [ ] Variables d'environnement configurées
- [ ] .env.production créé
- [ ] Images optimisées (WebP)
- [ ] Lighthouse score > 90
- [ ] Tests manuels effectués
- [ ] Documentation à jour
- [ ] CHANGELOG.md mis à jour

## Ressources

- **Vite**: https://vitejs.dev
- **React**: https://react.dev
- **Tailwind**: https://tailwindcss.com
- **Capacitor**: https://capacitorjs.com
- **Netlify**: https://docs.netlify.com
