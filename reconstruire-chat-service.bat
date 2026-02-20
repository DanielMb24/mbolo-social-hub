@echo off
chcp 65001 >nul
cls
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║   🔄 RECONSTRUCTION DU CHAT SERVICE                          ║
echo ║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
echo.
echo [1/3] Arrêt du chat-service...
echo.

cd backend
docker-compose stop chat-service

echo.
echo ✅ Chat-service arrêté
echo.
echo [2/3] Reconstruction du chat-service...
echo.

docker-compose build chat-service

echo.
echo ✅ Chat-service reconstruit
echo.
echo [3/3] Redémarrage du chat-service...
echo.

docker-compose up -d chat-service

echo.
echo ✅ Chat-service redémarré !
echo.
echo Attente de l'initialisation (15 secondes)...
timeout /t 15 /nobreak >nul

echo.
echo ✅ Chat-service prêt !
echo.
echo Test de l'endpoint :
curl -X GET "http://localhost:8083/api/chat/conversations/private/test456" -H "X-User-Id: test123"

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
