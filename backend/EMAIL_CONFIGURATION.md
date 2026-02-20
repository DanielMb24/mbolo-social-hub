# Configuration Email pour Mbolo

## Configuration Gmail

Pour activer l'envoi d'emails OTP via Gmail, suivez ces étapes :

### 1. Créer un mot de passe d'application Gmail

1. Allez sur votre compte Google : https://myaccount.google.com/
2. Sélectionnez "Sécurité" dans le menu de gauche
3. Activez la "Validation en deux étapes" si ce n'est pas déjà fait
4. Recherchez "Mots de passe des applications"
5. Créez un nouveau mot de passe d'application :
   - Sélectionnez "Autre (nom personnalisé)"
   - Nommez-le "Mbolo Auth Service"
   - Copiez le mot de passe généré (16 caractères)

### 2. Configuration locale

Créez ou modifiez le fichier `.env` dans le dossier `backend/auth-service/` :

```env
MAIL_USERNAME=votre-email@gmail.com
MAIL_PASSWORD=votre-mot-de-passe-application
```

### 3. Configuration Docker

Modifiez le fichier `backend/docker-compose.yml` pour ajouter les variables d'environnement :

```yaml
auth-service:
  environment:
    - MAIL_USERNAME=votre-email@gmail.com
    - MAIL_PASSWORD=votre-mot-de-passe-application
```

### 4. Configuration pour d'autres fournisseurs

#### Outlook/Hotmail
```yaml
spring:
  mail:
    host: smtp-mail.outlook.com
    port: 587
    username: ${MAIL_USERNAME}
    password: ${MAIL_PASSWORD}
```

#### Yahoo
```yaml
spring:
  mail:
    host: smtp.mail.yahoo.com
    port: 587
    username: ${MAIL_USERNAME}
    password: ${MAIL_PASSWORD}
```

#### SendGrid
```yaml
spring:
  mail:
    host: smtp.sendgrid.net
    port: 587
    username: apikey
    password: ${SENDGRID_API_KEY}
```

## Test de la configuration

Pour tester l'envoi d'emails :

```bash
# Démarrer le service auth
cd backend
docker-compose up auth-service

# Tester l'endpoint de réinitialisation
curl -X POST http://localhost:8081/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

## Dépannage

### Erreur "Authentication failed"
- Vérifiez que vous utilisez un mot de passe d'application, pas votre mot de passe Gmail
- Assurez-vous que la validation en deux étapes est activée

### Erreur "Connection timeout"
- Vérifiez votre connexion internet
- Vérifiez que le port 587 n'est pas bloqué par votre firewall

### Les emails arrivent dans les spams
- Configurez SPF, DKIM et DMARC pour votre domaine
- Utilisez un service d'envoi d'emails professionnel (SendGrid, Mailgun, etc.)

## Production

Pour la production, il est recommandé d'utiliser un service d'envoi d'emails dédié :

- **SendGrid** : 100 emails/jour gratuits
- **Mailgun** : 5000 emails/mois gratuits
- **Amazon SES** : Très économique, nécessite AWS
- **Postmark** : Excellent pour les emails transactionnels

Ces services offrent :
- Meilleure délivrabilité
- Statistiques détaillées
- Gestion des bounces
- Templates d'emails
- Support technique
