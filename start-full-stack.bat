@echo off
echo ========================================
echo DEMARRAGE MBOLO FULL-STACK
echo ========================================
echo.

echo [1/3] Verification des services Docker...
cd backend
docker-compose ps
echo.

echo [2/3] Demarrage du backend (si necessaire)...
docker-compose up -d
echo.

echo Attente du demarrage des services (30 secondes)...
timeout /t 30 /nobreak >nul
echo.

echo [3/3] Demarrage du frontend...
cd ..
start cmd /k "npm run dev"
echo.

echo ========================================
echo MBOLO EST PRET!
echo ========================================
echo.
echo Backend API Gateway: http://localhost:8080
echo Frontend React: http://localhost:5173
echo MongoDB Compass: mongodb+srv://devgroupentreprise_db_user:LWC5S7GRgfB2KN84@cluster-dga-1.xylzvke.mongodb.net/
echo.
echo Pour tester:
echo 1. Ouvrez http://localhost:5173
echo 2. Inscrivez-vous avec un nouveau compte
echo 3. Creez un post
echo 4. Verifiez dans MongoDB Compass que les donnees apparaissent!
echo.
pause
