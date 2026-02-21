@echo off
echo ========================================
echo DIAGNOSTIC COMPLET
echo ========================================
echo.

echo [1] Etat des services Docker:
docker-compose ps
echo.

echo ========================================
echo [2] Test connexion Auth Service:
echo ========================================
curl -s http://localhost:8081/actuator/health
echo.
echo.

echo ========================================
echo [3] Logs Auth Service (connexion MongoDB):
echo ========================================
docker logs mbolo-auth 2>&1 | findstr /i "mongodb connected started error exception" | Select-Object -Last 20
echo.

echo ========================================
echo [4] Test inscription directe:
echo ========================================
curl -X POST http://localhost:8081/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"diagtest\",\"email\":\"diag@test.com\",\"password\":\"test123\"}"
echo.
echo.

echo ========================================
echo [5] Logs apres inscription:
echo ========================================
timeout /t 2 /nobreak >nul
docker logs --tail 30 mbolo-auth 2>&1
echo.

echo ========================================
echo INSTRUCTIONS:
echo ========================================
echo.
echo 1. Verifiez si "Successfully connected to server" apparait dans les logs
echo 2. Verifiez s'il y a des erreurs MongoDB
echo 3. Si la connexion echoue, verifiez:
echo    - L'URI MongoDB dans application-docker.yml
echo    - Que votre IP est autorisee dans Atlas Network Access
echo    - Que le mot de passe est correct
echo.
pause
