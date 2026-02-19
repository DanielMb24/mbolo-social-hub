#!/bin/bash

echo "🔧 Configuration des permissions..."

# Rendre tous les scripts shell exécutables
chmod +x install.sh
chmod +x start-all.sh
chmod +x start-backend.sh
chmod +x health-check.sh
chmod +x backend/init-databases.sh
chmod +x backend/init-minio.sh

echo "✅ Permissions configurées!"
echo ""
echo "Vous pouvez maintenant exécuter:"
echo "  ./install.sh          - Installation complète"
echo "  ./start-all.sh        - Démarrer tout"
echo "  ./health-check.sh     - Vérifier la santé"
echo "  make help             - Voir toutes les commandes Make"
