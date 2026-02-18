# MBolo Backend - Spring Boot Microservices

Architecture microservices Spring Boot 3 + MongoDB pour la super-app MBolo.

## Services
- **api-gateway** (port 8080) - Spring Cloud Gateway, JWT validation, rate limiting
- **auth-service** (port 8081) - Inscription, login, JWT, refresh token, OTP
- **user-service** (port 8082) - Profils, avatars, blocage
- **chat-service** (port 8083) - WebSocket STOMP, messages, conversations
- **post-service** (port 8084) - Posts, commentaires, likes, feed
- **video-service** (port 8085) - Upload vidéo, streaming, likes
- **moderation-service** (port 8086) - Signalements, bannissements

## Prérequis
- Java 17+
- Maven 3.8+
- MongoDB
- Redis
- MinIO

## Lancement
```bash
docker-compose up -d
```

## Structure
Chaque service suit la clean architecture :
```
service/
├── src/main/java/com/mbolo/service/
│   ├── config/
│   ├── controller/
│   ├── dto/
│   ├── exception/
│   ├── model/
│   ├── repository/
│   ├── security/
│   └── service/
└── src/main/resources/
    └── application.yml
```
