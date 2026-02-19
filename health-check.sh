#!/bin/bash

echo "🏥 Vérification de la santé des services MBolo..."
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_service() {
    local name=$1
    local url=$2
    
    if curl -s -f "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $name${NC} - OK"
        return 0
    else
        echo -e "${RED}❌ $name${NC} - DOWN"
        return 1
    fi
}

check_docker_service() {
    local name=$1
    local container=$2
    
    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        local status=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null)
        if [ "$status" = "running" ]; then
            echo -e "${GREEN}✅ $name${NC} - Running"
            return 0
        else
            echo -e "${YELLOW}⚠️  $name${NC} - Status: $status"
            return 1
        fi
    else
        echo -e "${RED}❌ $name${NC} - Not found"
        return 1
    fi
}

echo "=== Infrastructure Services ==="
check_docker_service "MongoDB Auth" "mbolo-mongo-auth"
check_docker_service "MongoDB User" "mbolo-mongo-user"
check_docker_service "MongoDB Chat" "mbolo-mongo-chat"
check_docker_service "MongoDB Post" "mbolo-mongo-post"
check_docker_service "MongoDB Video" "mbolo-mongo-video"
check_docker_service "MongoDB Moderation" "mbolo-mongo-moderation"
check_docker_service "Redis" "mbolo-redis"
check_docker_service "MinIO" "mbolo-minio"

echo ""
echo "=== Backend Services ==="
check_service "API Gateway" "http://localhost:8080/actuator/health"
check_service "Auth Service" "http://localhost:8081/actuator/health"
check_service "User Service" "http://localhost:8082/actuator/health"
check_service "Chat Service" "http://localhost:8083/actuator/health"
check_service "Post Service" "http://localhost:8084/actuator/health"
check_service "Video Service" "http://localhost:8085/actuator/health"
check_service "Moderation Service" "http://localhost:8086/actuator/health"

echo ""
echo "=== Frontend ==="
if curl -s -f "http://localhost:5173" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend${NC} - Running on http://localhost:5173"
else
    echo -e "${YELLOW}⚠️  Frontend${NC} - Not running (run 'npm run dev')"
fi

echo ""
echo "=== Storage ==="
if curl -s -f "http://localhost:9001" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ MinIO Console${NC} - http://localhost:9001"
else
    echo -e "${RED}❌ MinIO Console${NC} - Not accessible"
fi

echo ""
echo "=== Summary ==="
echo "📊 Pour voir les logs: cd backend && docker-compose logs -f"
echo "🔄 Pour redémarrer: cd backend && docker-compose restart [service-name]"
echo "🛑 Pour arrêter: cd backend && docker-compose down"
