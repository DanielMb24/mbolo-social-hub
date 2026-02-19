#!/bin/bash

echo "🚀 Démarrage de MBolo Backend..."

cd backend

# Vérifier si Docker est en cours d'exécution
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker n'est pas en cours d'exécution. Veuillez démarrer Docker."
    exit 1
fi

# Créer le fichier .env s'il n'existe pas
if [ ! -f .env ]; then
    echo "📝 Création du fichier .env..."
    cp .env.example .env
fi

# Démarrer les services
echo "🐳 Démarrage des conteneurs Docker..."
docker-compose up -d

# Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 10

# Vérifier le statut
echo ""
echo "📊 Statut des services:"
docker-compose ps

echo ""
echo "✅ Backend démarré!"
echo ""
echo "🔗 URLs utiles:"
echo "   - API Gateway: http://localhost:8080"
echo "   - MinIO Console: http://localhost:9001 (mbolo_admin / mbolo_secret_2025)"
echo ""
echo "📝 Pour voir les logs: cd backend && docker-compose logs -f"
echo "🛑 Pour arrêter: cd backend && docker-compose down"
