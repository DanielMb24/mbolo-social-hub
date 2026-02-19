#!/bin/bash

echo "🚀 Démarrage complet de MBolo (Backend + Frontend)..."

# Démarrer le backend
echo ""
echo "=== BACKEND ==="
cd backend

if [ ! -f .env ]; then
    cp .env.example .env
fi

docker-compose up -d
cd ..

# Attendre que le backend soit prêt
echo "⏳ Attente du backend..."
sleep 15

# Démarrer le frontend
echo ""
echo "=== FRONTEND ==="

if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

echo "🎨 Démarrage du serveur de développement..."
npm run dev
