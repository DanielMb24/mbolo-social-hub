.PHONY: help install start stop restart logs health clean build test

help: ## Afficher l'aide
	@echo "MBolo - Commandes disponibles:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Installer toutes les dépendances
	@echo "📦 Installation des dépendances..."
	npm install
	@echo "✅ Installation terminée"

start: ## Démarrer tous les services
	@echo "🚀 Démarrage des services..."
	cd backend && docker-compose up -d
	@echo "⏳ Attente du démarrage (15s)..."
	@sleep 15
	@echo "✅ Services démarrés"
	@echo "💡 Lancez 'npm run dev' pour démarrer le frontend"

stop: ## Arrêter tous les services
	@echo "🛑 Arrêt des services..."
	cd backend && docker-compose down
	@echo "✅ Services arrêtés"

restart: ## Redémarrer tous les services
	@echo "🔄 Redémarrage des services..."
	cd backend && docker-compose restart
	@echo "✅ Services redémarrés"

logs: ## Voir les logs de tous les services
	cd backend && docker-compose logs -f

health: ## Vérifier la santé des services
	@chmod +x health-check.sh
	@./health-check.sh

clean: ## Nettoyer les conteneurs et volumes
	@echo "🧹 Nettoyage..."
	cd backend && docker-compose down -v
	@echo "✅ Nettoyage terminé"

build: ## Rebuild tous les services
	@echo "🔨 Rebuild des services..."
	cd backend && docker-compose up -d --build
	@echo "✅ Rebuild terminé"

init-db: ## Initialiser les bases de données
	@echo "🗄️  Initialisation des bases de données..."
	@chmod +x backend/init-databases.sh
	@cd backend && ./init-databases.sh
	@echo "✅ Bases de données initialisées"

init-minio: ## Initialiser MinIO
	@echo "🪣 Initialisation de MinIO..."
	@chmod +x backend/init-minio.sh
	@cd backend && ./init-minio.sh
	@echo "✅ MinIO initialisé"

dev: ## Démarrer le mode développement complet
	@echo "🚀 Démarrage du mode développement..."
	@make start
	@make init-db
	@make init-minio
	@echo "✅ Backend prêt!"
	@echo "💡 Lancez 'npm run dev' dans un autre terminal"

test: ## Lancer les tests
	npm run test

lint: ## Lancer le linter
	npm run lint

frontend: ## Démarrer uniquement le frontend
	npm run dev

backend-logs: ## Voir les logs du backend
	cd backend && docker-compose logs -f

status: ## Voir le statut des services
	cd backend && docker-compose ps
