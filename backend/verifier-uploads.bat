@echo off
echo ========================================
echo Verification des uploads
echo ========================================
echo.

echo 1. Verification du dossier uploads dans le conteneur...
docker-compose exec chat-service ls -la /tmp/uploads/chat 2>nul
if %errorlevel% neq 0 (
    echo ERREUR: Impossible d'acceder au conteneur chat-service
    echo Verifiez que le conteneur est en cours d'execution
    pause
    exit /b 1
)

echo.
echo 2. Verification des permissions...
docker-compose exec chat-service ls -ld /tmp/uploads/chat

echo.
echo 3. Nombre de fichiers dans le dossier...
docker-compose exec chat-service sh -c "ls -1 /tmp/uploads/chat | wc -l"

echo.
echo 4. Test d'acces HTTP aux fichiers...
echo Tentative d'acces a un fichier...
curl -I http://localhost:8080/uploads/chat/test.txt 2>nul

echo.
echo ========================================
echo Verification terminee
echo ========================================
pause
