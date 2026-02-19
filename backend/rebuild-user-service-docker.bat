@echo off
echo ========================================
echo Rebuild User Service avec Docker
echo ========================================
echo.

echo Arrêt du user-service...
docker-compose stop user-service

echo.
echo Rebuild de l'image...
docker-compose build user-service

echo.
echo Redémarrage du service...
docker-compose up -d user-service

echo.
echo Attente du démarrage (10 secondes)...
timeout /t 10 /nobreak

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
