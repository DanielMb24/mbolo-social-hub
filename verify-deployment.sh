#!/bin/bash

# ==========================================
# Script de Vérification du Déploiement
# ==========================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "================================================"
echo "  🔍 Vérification du Déploiement"
echo "  MBolo Social Hub sur Render"
echo "================================================"
echo ""

# Configuration
BASE_URL="https://mbolo"
FRONTEND_URL="${BASE_URL}-frontend.onrender.com"
GATEWAY_URL="${BASE_URL}-gateway.onrender.com"
AUTH_URL="${BASE_URL}-auth.onrender.com"
USER_URL="${BASE_URL}-user.onrender.com"
CHAT_URL="${BASE_URL}-chat.onrender.com"
POST_URL="${BASE_URL}-post.onrender.com"
VIDEO_URL="${BASE_URL}-video.onrender.com"
MODERATION_URL="${BASE_URL}-moderation.onrender.com"

# Fonction pour vérifier un service
check_service() {
    local name=$1
    local url=$2
    local endpoint=$3
    
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Vérification de $name${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo "URL: $url$endpoint"
    
    # Faire la requête
    response=$(curl -s -w "\n%{http_code}" "$url$endpoint" 2>/dev/null)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    # Vérifier le code HTTP
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✓ Status: $http_code (OK)${NC}"
        
        # Vérifier si c'est un service Spring Boot
        if echo "$body" | grep -q "UP"; then
            echo -e "${GREEN}✓ Service: UP${NC}"
        elif echo "$body" | grep -q "healthy"; then
            echo -e "${GREEN}✓ Service: Healthy${NC}"
        else
            echo -e "${YELLOW}⚠ Response: $body${NC}"
        fi
    else
        echo -e "${RED}✗ Status: $http_code (ERROR)${NC}"
        echo -e "${RED}Response: $body${NC}"
    fi
    
    echo ""
}

# Vérifier tous les services
check_service "Frontend" "$FRONTEND_URL" "/health"
check_service "API Gateway" "$GATEWAY_URL" "/actuator/health"
check_service "Auth Service" "$AUTH_URL" "/actuator/health"
check_service "User Service" "$USER_URL" "/actuator/health"
check_service "Chat Service" "$CHAT_URL" "/actuator/health"
check_service "Post Service" "$POST_URL" "/actuator/health"
check_service "Video Service" "$VIDEO_URL" "/actuator/health"
check_service "Moderation Service" "$MODERATION_URL" "/actuator/health"

# Résumé
echo "================================================"
echo "  ✅ Vérification terminée !"
echo "================================================"
echo ""
echo "Si tous les services retournent 'UP', le déploiement est réussi !"
echo ""
echo "Pour tester l'application complète :"
echo "  Ouvrez $FRONTEND_URL dans votre navigateur"
echo ""
