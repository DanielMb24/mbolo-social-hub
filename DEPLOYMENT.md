# MBolo - Guide de Déploiement Complet

## Architecture

MBolo est une application full-stack composée de:
- **Frontend**: React + TypeScript + Vite (port 5173)
- **Backend**: Microservices Spring Boot + API Gateway (port 8080)
- **Bases de données**: MongoDB (6 instances)
- **Cache**: Redis
- **Stockage**: MinIO (S3-compatible)

## Démarrage Rapide

### 1. Backend

```bash
cd backend
docker-compose up -d
```

Attendez que tous les services soient "healthy" (environ 2-3 minutes):

```bash
docker-compose ps
```

### 2. Frontend

```bash
npm install
npm run dev
```

L'application sera accessible sur: http://localhost:5173

## Configuration

### Variables d'environnement Backend

Créez `backend/.env`:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
MINIO_ACCESS_KEY=mbolo_admin
MINIO_SECRET_KEY=mbolo_secret_2025
```

### Variables d'environnement Frontend

Le fichier `.env.local` est déjà configuré:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
```

## Endpoints API

Tous les endpoints passent par l'API Gateway (http://localhost:8080):

- `/api/auth/**` → Auth Service (8081)
- `/api/users/**` → User Service (8082)
- `/api/chat/**` → Chat Service (8083)
- `/api/posts/**` → Post Service (8084)
- `/api/videos/**` → Video Service (8085)
- `/api/moderation/**` → Moderation Service (8086)

## Développement

### Backend uniquement

```bash
cd backend
docker-compose up -d
```

### Frontend uniquement

```bash
npm run dev
```

### Rebuild après modifications

```bash
# Backend
cd backend
docker-compose up -d --build [service-name]

# Frontend
npm run build
```

## Tests

```bash
# Frontend
npm run test

# Backend (exemple pour auth-service)
cd backend/auth-service
mvn test
```

## Production

### Build Frontend

```bash
npm run build
```

Les fichiers statiques seront dans `dist/`.

### Build Backend

```bash
cd backend
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Monitoring

- MinIO Console: http://localhost:9001
- Health Checks: http://localhost:808X/actuator/health

## Troubleshooting

Voir `backend/DEPLOYMENT.md` pour plus de détails.
