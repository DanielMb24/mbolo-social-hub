@echo off
chcp 65001 > nul
cls

echo ╔════════════════════════════════════════════════════════════╗
echo ║         Installation complète de MBolo Platform           ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo 🔍 Vérification des prérequis...

REM Vérifier Docker
docker --version > nul 2>&1
if errorlevel 1 (
    echo ❌ Docker n'est pas installé. Veuillez installer Docker Desktop.
    echo    Téléchargez depuis: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

docker info > nul 2>&1
if errorlevel 1 (
    echo ❌ Docker n'est pas en cours d'exécution. Veuillez démarrer Docker Desktop.
    pause
    exit /b 1
)

echo ✅ Docker est installé et en cours d'exécution

REM Vérifier Node.js
node --version > nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js n'est pas installé. Veuillez installer Node.js 18+.
    echo    Téléchargez depuis: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js est installé

REM Vérifier npm
npm --version > nul 2>&1
if errorlevel 1 (
    echo ❌ npm n'est pas installé.
    pause
    exit /b 1
)

echo ✅ npm est installé

echo.
echo ════════════════════════════════════════════════════════════
echo 📦 Installation des dépendances Frontend...
echo ════════════════════════════════════════════════════════════

call npm install

if errorlevel 1 (
    echo ❌ Erreur lors de l'installation des dépendances npm
    pause
    exit /b 1
)

echo ✅ Dépendances Frontend installées

echo.
echo ════════════════════════════════════════════════════════════
echo 🐳 Configuration du Backend...
echo ════════════════════════════════════════════════════════════

cd backend

REM Créer le fichier .env s'il n'existe pas
if not exist .env (
    echo 📝 Création du fichier .env...
    copy .env.example .env > nul
    echo ✅ Fichier .env créé
) else (
    echo ✅ Fichier .env existe déjà
)

echo.
echo 🐳 Démarrage des conteneurs Docker...
docker-compose up -d

if errorlevel 1 (
    echo ❌ Erreur lors du démarrage des conteneurs
    pause
    exit /b 1
)

echo.
echo ⏳ Attente du démarrage des services (30 secondes)...
timeout /t 30 /nobreak > nul

echo.
echo ════════════════════════════════════════════════════════════
echo 🗄️  Initialisation des bases de données...
echo ════════════════════════════════════════════════════════════

call init-databases.bat

echo.
echo ════════════════════════════════════════════════════════════
echo 🪣 Initialisation de MinIO...
echo ════════════════════════════════════════════════════════════

call init-minio.bat

cd ..

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║              ✅ Installation terminée!                     ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 🚀 Pour démarrer l'application:
echo.
echo    Backend (déjà démarré):
echo    └─ API Gateway: http://localhost:8080
echo.
echo    Frontend:
echo    └─ npm run dev
echo    └─ http://localhost:5173
echo.
echo 🔧 Outils de gestion:
echo    └─ MinIO Console: http://localhost:9001
echo       Username: mbolo_admin
echo       Password: mbolo_secret_2025
echo.
echo 📊 Vérifier le statut des services:
echo    └─ cd backend ^&^& docker-compose ps
echo.
echo 📝 Voir les logs:
echo    └─ cd backend ^&^& docker-compose logs -f [service-name]
echo.
echo 🛑 Arrêter les services:
echo    └─ cd backend ^&^& docker-compose down
echo.
pause
