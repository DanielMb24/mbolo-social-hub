@echo off
REM ==========================================
REM Rebuild API Gateway et Chat Service
REM ==========================================

echo.
echo ========================================
echo   Rebuild API Gateway et Chat Service
echo ========================================
echo.

cd /d "%~dp0"

echo [1/8] Arret des services...
docker-compose stop api-gateway chat-service

echo.
echo [2/8] Suppression des anciens conteneurs...
docker-compose rm -f api-gateway chat-service

echo.
echo [3/8] Rebuild API Gateway...
docker-compose build --no-cache api-gateway

echo.
echo [4/8] Rebuild Chat Service...
docker-compose build --no-cache chat-service

echo.
echo [5/8] Demarrage API Gateway...
docker-compose up -d api-gateway

echo.
echo [6/8] Attente 10 secondes...
timeout /t 10 /nobreak

echo.
echo [7/8] Demarrage Chat Service...
docker-compose up -d chat-service

echo.
echo [8/8] Attente 5 secondes...
timeout /t 5 /nobreak

echo.
echo ========================================
echo   Services Rebuildes !
echo ========================================
echo.
echo Verification des logs :
echo   docker-compose logs -f api-gateway chat-service
echo.
echo Test de l'API :
echo   curl http://localhost:8080/actuator/health
echo   curl http://localhost:8080/api/chat/conversations
echo.
pause
