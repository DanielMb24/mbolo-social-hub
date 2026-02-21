@echo off
echo ========================================
echo REDEMARRAGE DES SERVICES
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Arret des services...
docker-compose down
echo.

echo [2/3] Demarrage des services...
docker-compose up -d
echo.

echo [3/3] Attente du demarrage (30 secondes)...
timeout /t 30 /nobreak >nul
echo.

echo ========================================
echo ETAT DES SERVICES:
echo ========================================
docker-compose ps
echo.

echo ========================================
echo TEST DE CONNEXION:
echo ========================================
echo.
echo Test API Gateway (port 8080):
curl -s http://localhost:8080/actuator/health 2>nul
if errorlevel 1 (
    echo   [ERREUR] API Gateway ne repond pas
    echo   Verifiez les logs: docker logs mbolo-gateway
) else (
    echo   [OK] API Gateway est accessible
)
echo.

echo Test Auth Service (port 8081):
curl -s http://localhost:8081/actuator/health 2>nul
if errorlevel 1 (
    echo   [ERREUR] Auth Service ne repond pas
    echo   Verifiez les logs: docker logs mbolo-auth
) else (
    echo   [OK] Auth Service est accessible
)
echo.

echo ========================================
echo Pour voir les logs en temps reel:
echo   docker-compose logs -f
echo.
pause
