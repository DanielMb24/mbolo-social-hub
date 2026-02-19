# MBolo Backend - Guide de Déploiement

## Prérequis

- Docker et Docker Compose installés
- Java 17+ (pour développement local)
- Maven 3.9+ (pour développement local)

## Démarrage avec Docker

### 1. Configuration des variables d'environnement

Copiez le fichier d'exemple et modifiez les valeurs:

```bash
cp .env.example .env
```

### 2. Démarrer tous les services

```bash
cd backend
docker-compose up -d
```

### 3. Vérifier le statut des services

```bash
docker-compose ps
```

### 4. Voir les logs

```bash
# Tous les services
docker-compose logs -f

# Un service spécifique
docker-compose logs -f auth-service
```

## Services et Ports

| Service | Port | Health Check |
|---------|------|--------------|
| API Gateway | 8080 | http://localhost:8080/actuator/health |
| Auth Service | 8081 | http://localhost:8081/actuator/health |
| User Service | 8082 | http://localhost:8082/actuator/health |
| Chat Service | 8083 | http://localhost:8083/actuator/health |
| Post Service | 8084 | http://localhost:8084/actuator/health |
| Video Service | 8085 | http://localhost:8085/actuator/health |
| Moderation Service | 8086 | http://localhost:8086/actuator/health |
| Redis | 6379 | - |
| MinIO | 9000 (API), 9001 (Console) | http://localhost:9001 |
| MongoDB Auth | 27017 | - |
| MongoDB User | 27018 | - |
| MongoDB Chat | 27019 | - |
| MongoDB Post | 27020 | - |
| MongoDB Video | 27021 | - |
| MongoDB Moderation | 27022 | - |

## Développement Local (sans Docker)

### 1. Démarrer les bases de données

```bash
docker-compose up -d mongo-auth mongo-user mongo-chat mongo-post mongo-video mongo-moderation redis minio
```

### 2. Compiler et démarrer chaque service

```bash
# Auth Service
cd auth-service
mvn clean install
mvn spring-boot:run

# User Service
cd user-service
mvn clean install
mvn spring-boot:run

# Etc...
```

## Arrêter les services

```bash
docker-compose down

# Avec suppression des volumes (données)
docker-compose down -v
```

## Rebuild après modifications

```bash
docker-compose up -d --build
```

## Accès MinIO Console

URL: http://localhost:9001
Username: mbolo_admin
Password: mbolo_secret_2025

## Troubleshooting

### Les services ne démarrent pas

1. Vérifiez les logs: `docker-compose logs -f [service-name]`
2. Vérifiez que les ports ne sont pas déjà utilisés
3. Vérifiez que Docker a assez de mémoire (minimum 4GB recommandé)

### Erreurs de connexion MongoDB

Les services utilisent des profils Spring différents:
- Local: `mongodb://localhost:2701X`
- Docker: `mongodb://mongo-X:27017`

Le profil `docker` est automatiquement activé dans docker-compose.

### Rebuild complet

```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```
