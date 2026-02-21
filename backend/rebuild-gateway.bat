@echo off
REM ==========================================
REM Rebuild API Gateway
REM ==========================================

echo.
echo ========================================
echo   Rebuild API Gateway
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Arret de l'API Gateway...
docker-compose stop api-gateway

echo.
echo [2/4] Suppression de l'ancien conteneur...
docker-compose rm -f api-gateway

echo.
echo [3/4] Rebuild de l'image...
docker-compose build --no-cache api-gateway

echo.
echo [4/4] Demarrage de l'API Gateway...
docker-compose up -d api-gateway

echo.
echo ========================================
echo   API Gateway Rebuilde !
echo ========================================
echo.
echo Verification des logs :
echo   docker-compose logs -f api-gateway
echo.
echo Test de l'API :
echo   curl http://localhost:8080/actuator/health
echo.
pause
