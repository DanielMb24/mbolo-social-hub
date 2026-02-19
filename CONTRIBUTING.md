# Guide de Contribution - MBolo

Merci de votre intérêt pour contribuer à MBolo! 🎉

## 🚀 Démarrage Rapide

1. **Fork le projet**
2. **Clone votre fork:**
   ```bash
   git clone https://github.com/VOTRE-USERNAME/mbolo.git
   cd mbolo
   ```
3. **Installer les dépendances:**
   ```bash
   ./install.sh  # Linux/Mac
   install.bat   # Windows
   ```

## 📝 Workflow de Contribution

### 1. Créer une branche

```bash
git checkout -b feature/ma-nouvelle-fonctionnalite
# ou
git checkout -b fix/correction-bug
```

### 2. Faire vos modifications

- Suivez les conventions de code existantes
- Ajoutez des tests si nécessaire
- Mettez à jour la documentation

### 3. Tester vos modifications

```bash
# Frontend
npm run test
npm run lint

# Backend (exemple)
cd backend/auth-service
mvn test
```

### 4. Commit

Utilisez des messages de commit clairs:

```bash
git commit -m "feat: ajouter la fonctionnalité X"
git commit -m "fix: corriger le bug Y"
git commit -m "docs: mettre à jour le README"
```

Conventions:
- `feat:` - Nouvelle fonctionnalité
- `fix:` - Correction de bug
- `docs:` - Documentation
- `style:` - Formatage, pas de changement de code
- `refactor:` - Refactoring
- `test:` - Ajout de tests
- `chore:` - Maintenance

### 5. Push et Pull Request

```bash
git push origin feature/ma-nouvelle-fonctionnalite
```

Puis créez une Pull Request sur GitHub.

## 🎨 Standards de Code

### Frontend (TypeScript/React)

- Utilisez TypeScript strict
- Suivez les conventions React Hooks
- Utilisez les composants shadcn/ui existants
- Formatage: 2 espaces, single quotes

### Backend (Java/Spring Boot)

- Java 17+
- Suivez les conventions Spring Boot
- Utilisez Lombok pour réduire le boilerplate
- Formatage: 4 espaces

## 🧪 Tests

### Frontend

```bash
npm run test          # Lancer les tests
npm run test:watch    # Mode watch
```

### Backend

```bash
cd backend/[service-name]
mvn test
```

## 📚 Documentation

- Mettez à jour le README si nécessaire
- Documentez les nouvelles APIs
- Ajoutez des commentaires pour le code complexe

## 🐛 Signaler un Bug

1. Vérifiez que le bug n'a pas déjà été signalé
2. Créez une issue avec:
   - Description claire du problème
   - Étapes pour reproduire
   - Comportement attendu vs actuel
   - Captures d'écran si pertinent
   - Environnement (OS, versions, etc.)

## 💡 Proposer une Fonctionnalité

1. Créez une issue "Feature Request"
2. Décrivez:
   - Le problème que ça résout
   - La solution proposée
   - Des alternatives considérées
   - Impact sur l'existant

## ✅ Checklist avant PR

- [ ] Le code compile sans erreurs
- [ ] Les tests passent
- [ ] Le linter ne remonte pas d'erreurs
- [ ] La documentation est à jour
- [ ] Les commits sont clairs et atomiques
- [ ] La branche est à jour avec main

## 🤝 Code de Conduite

- Soyez respectueux et inclusif
- Acceptez les critiques constructives
- Concentrez-vous sur ce qui est meilleur pour la communauté
- Montrez de l'empathie envers les autres

## 📞 Questions?

- Ouvrez une issue
- Contactez les mainteneurs
- Consultez la documentation

Merci de contribuer à MBolo! 🙏
