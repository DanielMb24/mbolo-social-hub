#!/bin/bash

echo "🔍 Vérification des bases de données MongoDB..."
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

verify_db() {
    local container=$1
    local dbname=$2
    
    echo -e "${YELLOW}Vérification de $dbname...${NC}"
    
    # Vérifier que le conteneur existe
    if ! docker ps | grep -q $container; then
        echo -e "${RED}❌ Conteneur $container non trouvé${NC}"
        return 1
    fi
    
    # Lister les collections
    collections=$(docker exec $container mongosh $dbname --quiet --eval "db.getCollectionNames().join(', ')" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $dbname${NC}"
        echo "   Collections: $collections"
        
        # Compter les documents
        for collection in $(docker exec $container mongosh $dbname --quiet --eval "db.getCollectionNames().join(' ')" 2>/dev/null); do
            count=$(docker exec $container mongosh $dbname --quiet --eval "db.$collection.countDocuments()" 2>/dev/null)
            echo "   - $collection: $count documents"
        done
    else
        echo -e "${RED}❌ Erreur lors de la vérification de $dbname${NC}"
    fi
    echo ""
}

# Vérifier toutes les bases
verify_db "mbolo-mongo-auth" "mbolo_auth"
verify_db "mbolo-mongo-user" "mbolo_user"
verify_db "mbolo-mongo-chat" "mbolo_chat"
verify_db "mbolo-mongo-post" "mbolo_post"
verify_db "mbolo-mongo-video" "mbolo_video"
verify_db "mbolo-mongo-moderation" "mbolo_moderation"

echo "📊 Résumé de la vérification terminé"
echo ""
echo "💡 Pour se connecter à une base:"
echo "   docker exec -it mbolo-mongo-auth mongosh mbolo_auth"
