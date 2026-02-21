@echo off
echo ========================================
echo TEST API DIRECTEMENT (sans Gateway)
echo ========================================
echo.

cd /d "%~dp0"

echo [1] Verification que les services sont demarres:
docker-compose ps | findstr "Up"
echo.

echo ========================================
echo [2] Test Auth Service directement (port 8081):
echo ========================================
echo.
echo Tentative d'inscription...
curl -X POST http://localhost:8081/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"atlasuser\",\"email\":\"atlas@mbolo.com\",\"password\":\"test123\"}"
echo.
echo.

echo ========================================
echo [3] Verification des logs Auth Service:
echo ========================================
docker logs --tail 30 mbolo-auth | findstr /i "mongo atlas connected insert"
echo.

echo ========================================
echo INSTRUCTIONS:
echo ========================================
echo.
echo 1. Dans MongoDB Compass, cliquez sur la connexion:
echo    cluster-dga-1.xylzvke.mongodb.net
echo.
echo 2. Cherchez la base "mbolo_auth"
echo.
echo 3. Ouvrez la collection "userAuths"
echo.
echo 4. Vous devriez voir l'utilisateur "atlasuser"
echo.
pause
