@echo off
chcp 65001 >nul
cls
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║   🔄 REDÉMARRAGE DU BACKEND - MBOLO                          ║
echo ║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
echo.
echo [1/3] Arrêt des services...
echo.

cd backend
docker-compose down

echo.
echo ✅ Services arrêtés
echo.
echo [2/3] Reconstruction de l'API Gateway...
echo.

docker-compose build api-gateway

echo.
echo ✅ API Gateway reconstruit
echo.
echo [3/3] Redémarrage de tous les services...
echo.

docker-compose up -d

echo.
echo ✅ Services redémarrés !
echo.
echo ═══════════════════════════════════════════════════════════════
echo.
echo Attente de l'initialisation (15 secondes)...
timeout /t 15 /nobreak >nul

echo.
echo ✅ Backend prêt !
echo.
echo Services actifs :
docker-compose ps

cd ..

echo.
echo ═══════════════════════════════════════════════════════════════
echo.
echo 📋 PROCHAINES ÉTAPES :
echo.
echo 1. Videz le cache du navigateur (Ctrl+Shift+R)
echo 2. Testez la création de conversation
echo 3. Vérifiez la console (F12) pour les erreurs
echo.
echo ═══════════════════════════════════════════════════════════════
echo.
pause
