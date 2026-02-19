@echo off
echo ========================================
echo TEST RAPIDE DES SERVICES
echo ========================================
echo.

cd /d "%~dp0"

echo [1] Services en cours:
docker-compose ps
echo.

echo [2] Test Auth Service (port 8081):
curl -s http://localhost:8081/actuator/health
echo.
echo.

echo [3] Si le service repond, test d'inscription:
curl -X POST http://localhost:8081/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"testuser\",\"email\":\"test@mbolo.com\",\"password\":\"test123\"}"
echo.
echo.

echo [4] Logs Auth Service (connexion MongoDB):
docker logs mbolo-auth 2>&1 | findstr /i "mongodb connected" | Select-Object -Last 5
echo.

echo ========================================
echo RESULTAT:
echo ========================================
echo Si vous voyez "Successfully connected to server", c'est bon!
echo Rafraichissez MongoDB Compass pour voir la base mbolo_auth
echo.
pause
