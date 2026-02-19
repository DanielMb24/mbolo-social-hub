@echo off
echo ========================================
echo TEST DE CONNEXION MONGODB ATLAS
echo ========================================
echo.

echo Verification des services Docker...
docker-compose ps
echo.

echo ========================================
echo LOGS AUTH SERVICE (derniere minute)
echo ========================================
docker logs --tail 50 mbolo-auth | findstr /i "mongo connected database"
echo.

echo ========================================
echo LOGS VIDEO SERVICE (derniere minute)
echo ========================================
docker logs --tail 50 mbolo-video | findstr /i "mongo connected database"
echo.

echo ========================================
echo LOGS USER SERVICE (derniere minute)
echo ========================================
docker logs --tail 50 mbolo-user | findstr /i "mongo connected database"
echo.

echo ========================================
echo INSTRUCTIONS
echo ========================================
echo.
echo 1. Connectez MongoDB Compass avec cette URI:
echo    mongodb+srv://devgroupentreprise_db_user:LWC5S7GRgfB2KN84@cluster-dga-1.xylzvke.mongodb.net/
echo.
echo 2. Testez l'API d'inscription:
echo    curl -X POST http://localhost:8080/api/auth/register ^
echo      -H "Content-Type: application/json" ^
echo      -d "{\"username\":\"testuser\",\"email\":\"test@mbolo.com\",\"password\":\"test123\"}"
echo.
echo 3. Verifiez dans Compass que la collection "userAuths" apparait dans "mbolo_auth"
echo.
pause
