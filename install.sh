#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         Installation complète de MBolo Platform           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Vérifier les prérequis
echo "🔍 Vérification des prérequis..."

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez installer Docker Desktop."
    echo "   Téléchargez depuis: https://www.docker.com/products/docker-desktop"
    exit 1
fi

if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker n'est pas en cours d'exécution. Veuillez démarrer Docker Desktop."
    exit 1
fi

echo "✅ Docker est installé et en cours d'exécution"

# Vérifier Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé."
    exit 1
fi

echo "✅ Docker Compose est installé"

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez installer Node.js 18+."
    echo "   Téléchargez depuis: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ est requis. Version actuelle: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) est installé"

# Vérifier npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé."
    exit 1
fi

echo "✅ npm $(npm -v) est installé"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "📦 Installation des dépendances Frontend..."
echo "════════════════════════════════════════════════════════════"

npm install

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de l'installation des dépendances npm"
    exit 1
fi

echo "✅ Dépendances Frontend installées"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "🐳 Configuration du Backend..."
echo "════════════════════════════════════════════════════════════"

cd backend

# Créer le fichier .env s'il n'existe pas
if [ ! -f .env ]; then
    echo "📝 Création du fichier .env..."
    cp .env.example .env
    echo "✅ Fichier .env créé"
else
    echo "✅ Fichier .env existe déjà"
fi

echo ""
echo "🐳 Démarrage des conteneurs Docker..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors du démarrage des conteneurs"
    exit 1
fi

echo ""
echo "⏳ Attente du démarrage des services (30 secondes)..."
sleep 30

echo ""
echo "════════════════════════════════════════════════════════════"
echo "🗄️  Initialisation des bases de données..."
echo "════════════════════════════════════════════════════════════"

chmod +x init-databases-advanced.sh
chmod +x seed-test-data.sh
chmod +x verify-databases.sh
./init-databases-advanced.sh

echo ""
echo "🌱 Insertion de données de test..."
./seed-test-data.sh

echo ""
echo "════════════════════════════════════════════════════════════"
echo "🪣 Initialisation de MinIO..."
echo "════════════════════════════════════════════════════════════"

chmod +x init-minio.sh
./init-minio.sh

cd ..

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              ✅ Installation terminée!                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "🚀 Pour démarrer l'application:"
echo ""
echo "   Backend (déjà démarré):"
echo "   └─ API Gateway: http://localhost:8080"
echo ""
echo "   Frontend:"
echo "   └─ npm run dev"
echo "   └─ http://localhost:5173"
echo ""
echo "🔧 Outils de gestion:"
echo "   └─ MinIO Console: http://localhost:9001"
echo "      Username: mbolo_admin"
echo "      Password: mbolo_secret_2025"
echo ""
echo "📊 Vérifier le statut des services:"
echo "   └─ cd backend && docker-compose ps"
echo ""
echo "📝 Voir les logs:"
echo "   └─ cd backend && docker-compose logs -f [service-name]"
echo ""
echo "🛑 Arrêter les services:"
echo "   └─ cd backend && docker-compose down"
echo ""
