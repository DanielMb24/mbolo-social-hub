@echo off
echo ========================================
echo Rebuild User Service (No Cache)
echo ========================================
echo.

echo Arrêt du user-service...
docker-compose stop user-service

echo.
echo Suppression de l'ancienne image...
docker-compose rm -f user-service
docker rmi backend-user-service 2>nul

echo.
echo Rebuild de l'image (sans cache)...
docker-compose build --no-cache user-service

echo.
echo Redémarrage du service...
docker-compose up -d user-service

echo.
echo Attente du démarrage (15 secondes)...
timeout /t 15 /nobreak

echo.
echo ========================================
echo Service redémarré!
echo ========================================
echo.
echo Vérification des logs:
docker-compose logs --tail=50 user-service

echo.
echo Pour voir les logs en temps réel:
echo docker-compose logs -f user-service
pause
