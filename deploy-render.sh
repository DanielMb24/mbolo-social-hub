#!/bin/bash

# ==========================================
# Script de Déploiement Render.com
# ==========================================

set -e

echo "🚀 Déploiement MBolo Social Hub sur Render.com"
echo "================================================"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
info() {
    echo -e "${GREEN}✓${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

# Vérifier si git est installé
if ! command -v git &> /dev/null; then
    error "Git n'est pas installé. Installez-le d'abord."
    exit 1
fi

info "Git est installé"

# Vérifier si on est dans un repo git
if [ ! -d .git ]; then
    warn "Pas de repository git détecté. Initialisation..."
    git init
    info "Repository git initialisé"
fi

# Vérifier les fichiers nécessaires
echo ""
echo "📋 Vérification des fichiers..."

files=(
    "Dockerfile"
    "nginx.conf"
    "render.yaml"
    ".dockerignore"
    "package.json"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        info "$file existe"
    else
        error "$file manquant"
        exit 1
    fi
done

# Vérifier les Dockerfiles backend
echo ""
echo "📋 Vérification des Dockerfiles backend..."

backend_services=(
    "api-gateway"
    "auth-service"
    "user-service"
    "chat-service"
    "post-service"
    "video-service"
    "moderation-service"
)

for service in "${backend_services[@]}"; do
    if [ -f "backend/$service/Dockerfile" ]; then
        info "backend/$service/Dockerfile existe"
    else
        error "backend/$service/Dockerfile manquant"
        exit 1
    fi
done

# Build test local (optionnel)
echo ""
read -p "Voulez-vous tester le build localement ? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    info "Test du build frontend..."
    npm run build
    if [ $? -eq 0 ]; then
        info "Build frontend réussi"
    else
        error "Build frontend échoué"
        exit 1
    fi
fi

# Vérifier le statut git
echo ""
echo "📦 Préparation du commit..."

# Ajouter tous les fichiers
git add .

# Vérifier s'il y a des changements
if git diff-index --quiet HEAD --; then
    warn "Aucun changement à commiter"
else
    # Commit
    read -p "Message de commit (défaut: 'Prêt pour déploiement Render'): " commit_msg
    commit_msg=${commit_msg:-"Prêt pour déploiement Render"}
    
    git commit -m "$commit_msg"
    info "Changements commités"
fi

# Vérifier si un remote existe
if git remote | grep -q origin; then
    info "Remote 'origin' existe"
    
    # Demander si on doit pousser
    echo ""
    read -p "Voulez-vous pousser vers GitHub ? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        info "Push vers GitHub..."
        git push origin main || git push origin master
        info "Code poussé vers GitHub"
    fi
else
    warn "Aucun remote 'origin' configuré"
    echo ""
    echo "Pour ajouter un remote :"
    echo "  git remote add origin https://github.com/votre-username/mbolo-social-hub.git"
    echo "  git push -u origin main"
fi

# Instructions finales
echo ""
echo "================================================"
echo "✅ Préparation terminée !"
echo "================================================"
echo ""
echo "📝 Prochaines étapes :"
echo ""
echo "1. Allez sur https://dashboard.render.com"
echo "2. Cliquez sur 'New' → 'Blueprint'"
echo "3. Sélectionnez votre repository GitHub"
echo "4. Render détectera automatiquement render.yaml"
echo "5. Configurez les variables d'environnement :"
echo "   - MAIL_USERNAME"
echo "   - MAIL_PASSWORD"
echo "   - GOOGLE_CLIENT_ID"
echo "   - GOOGLE_CLIENT_SECRET"
echo "   - MINIO_ACCESS_KEY"
echo "   - MINIO_SECRET_KEY"
echo "   - JWT_SECRET"
echo "6. Cliquez sur 'Apply'"
echo ""
echo "📚 Documentation complète : GUIDE_DEPLOIEMENT_RENDER.md"
echo ""
echo "🎉 Bon déploiement !"
