# MBolo Backend - Microservices

Architecture microservices pour la plateforme sociale MBolo.

## 🏗️ Architecture

### Services

| Service | Port | Description |
|---------|------|-------------|
| API Gateway | 8080 | Point d'entrée unique, routing, CORS |
| Auth Service | 8081 | Authentification JWT, refresh tokens |
| User Service | 8082 | Profils utilisateurs, avatars |
| Chat Service | 8083 | Messagerie temps réel (WebSocket) |
| Post Service | 8084 | Publications, commentaires, likes |
| Video Service | 8085 | Upload et streaming vidéo |
| Moderation Service | 8086 | Modération, reports, bans |

### Infrastructure

| Service | Port | Description |
|---------|------|-------------|
| MongoDB Auth | 27017 | Base de données auth |
| MongoDB User | 27018 | Base de données user |
| MongoDB Chat | 27019 | Base de données chat |
| MongoDB Post | 27020 | Base de données post |
| MongoDB Video | 27021 | Base de données video |
| MongoDB Moderation | 27022 | Base de données moderation |
| Redis | 6379 | Cache et sessions |
| MinIO | 9000/9001 | Stockage S3-compatible |

## 🚀 Démarrage Rapide

```bash
# Démarrer tous les services
docker-compose up -d

# Initialiser les bases de données
./init-databases-advanced.sh    # Linux/Mac
init-databases.bat              # Windows

# Insérer des données de test
./seed-test-data.sh    # Linux/Mac
seed-test-data.bat     # Windows

# Vérifier la santé
curl http://localhost:8080/actuator/health
```

## 📚 Documentation

- [Guide de Déploiement](./DEPLOYMENT.md)
- [Guide de la Base de Données](./DATABASE.md)
- [Référence Rapide DB](./DATABASE_QUICK_REFERENCE.md)

## 🔧 Développement

### Prérequis

- Docker & Docker Compose
- Java 17+ (pour développement local)
- Maven 3.9+ (pour développement local)

### Build Local

```bash
# Build un service
cd auth-service
mvn clean install

# Lancer un service
mvn spring-boot:run
```

### Tests

```bash
cd auth-service
mvn test
```

## 📊 Monitoring

### Health Checks

```bash
# Tous les services
curl http://localhost:8080/actuator/health
curl http://localhost:8081/actuator/health
curl http://localhost:8082/actuator/health
curl http://localhost:8083/actuator/health
curl http://localhost:8084/actuator/health
curl http://localhost:8085/actuator/health
curl http://localhost:8086/actuator/health
```

### Logs

```bash
# Tous les services
docker-compose logs -f

# Un service spécifique
docker-compose logs -f auth-service
```

## 🔐 Sécurité

- JWT avec access + refresh tokens
- BCrypt pour les mots de passe (strength 12)
- CORS configuré sur API Gateway
- Rate limiting
- Variables d'environnement pour les secrets

## 🗄️ Base de Données

Voir [DATABASE.md](./DATABASE.md) pour la documentation complète.

### Connexion

```bash
docker exec -it mbolo-mongo-auth mongosh mbolo_auth
```

### Vérification

```bash
./verify-databases.sh    # Linux/Mac
verify-databases.bat     # Windows
```

## 🛠️ Scripts Utiles

| Script | Description |
|--------|-------------|
| `init-databases.sh` | Initialisation basique |
| `init-databases-advanced.sh` | Init avec tous les index |
| `seed-test-data.sh` | Données de test |
| `verify-databases.sh` | Vérification des bases |
| `init-minio.sh` | Initialisation MinIO |

## 📝 Configuration

### Variables d'Environnement

Créez un fichier `.env`:

```env
JWT_SECRET=your-super-secret-jwt-key
MINIO_ACCESS_KEY=mbolo_admin
MINIO_SECRET_KEY=mbolo_secret_2025
SPRING_PROFILES_ACTIVE=docker
```

### Profils Spring

- `default` - Développement local (localhost)
- `docker` - Conteneurs Docker (noms de services)

## 🔄 CI/CD

À venir:
- GitHub Actions
- Tests automatisés
- Déploiement automatique

## 📞 Support

- Documentation: [../README.md](../README.md)
- Issues: GitHub Issues
- Contribution: [../CONTRIBUTING.md](../CONTRIBUTING.md)
