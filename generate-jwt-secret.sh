#!/bin/bash

# ==========================================
# Générateur de JWT Secret Sécurisé
# ==========================================

echo ""
echo "========================================"
echo "  Générateur de JWT Secret"
echo "========================================"
echo ""

echo "Génération d'un secret JWT sécurisé..."
echo ""

# Générer un secret de 64 caractères (256 bits)
if command -v openssl &> /dev/null; then
    # Utiliser OpenSSL si disponible
    secret=$(openssl rand -base64 32)
elif command -v python3 &> /dev/null; then
    # Utiliser Python si disponible
    secret=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
else
    echo "Erreur: OpenSSL ou Python3 requis"
    exit 1
fi

echo "Secret JWT généré :"
echo ""
echo "$secret"
echo ""

echo "========================================"
echo "  Secret JWT généré !"
echo "========================================"
echo ""
echo "Copiez le secret ci-dessus et utilisez-le pour :"
echo "  - JWT_SECRET dans .env.render"
echo "  - GATEWAY_JWT_SECRET"
echo "  - AUTH_JWT_SECRET"
echo ""
echo "IMPORTANT : Utilisez le MÊME secret pour tous les services"
echo ""
