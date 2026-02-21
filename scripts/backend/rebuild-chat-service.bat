@echo off
REM ==========================================
REM Rebuild Chat Service
REM ==========================================

echo.
echo ========================================
echo   Rebuild Chat Service
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Arret du chat-service...
docker-compose stop chat-service

echo.
echo [2/4] Suppression de l'ancien conteneur...
docker-compose rm -f chat-service

echo.
echo [3/4] Rebuild de l'image...
docker-compose build --no-cache chat-service

echo.
echo [4/4] Demarrage du chat-service...
docker-compose up -d chat-service

echo.
echo ========================================
echo   Chat Service Rebuilde !
echo ========================================
echo.
echo Verification des logs :
echo   docker-compose logs -f chat-service
echo.
echo Test de l'upload :
echo   curl -X POST http://localhost:8080/api/chat/upload ^
echo        -H "Authorization: Bearer YOUR_TOKEN" ^
echo        -F "file=@test.jpg" ^
echo        -F "conversationId=123" ^
echo        -F "type=IMAGE"
echo.
pause
