@echo off
echo ========================================
echo RECONSTRUCTION DES SERVICES AVEC ATLAS
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Arret des services en cours...
docker-compose down
echo.

echo [2/4] Suppression des anciennes images...
docker-compose rm -f
echo.

echo [3/4] Reconstruction des images Docker...
docker-compose build --no-cache
echo.

echo [4/4] Demarrage des services avec MongoDB Atlas...
docker-compose up -d
echo.

echo ========================================
echo VERIFICATION DES SERVICES
echo ========================================
timeout /t 10 /nobreak >nul
docker-compose ps
echo.

echo ========================================
echo MIGRATION VERS ATLAS TERMINEE!
echo ========================================
echo.
echo Les services utilisent maintenant MongoDB Atlas:
echo mongodb+srv://cluster-dga-1.xylzvke.mongodb.net/
echo.
echo Pour voir les logs d'un service:
echo   docker logs mbolo-auth
echo   docker logs mbolo-video
echo.
echo Pour connecter MongoDB Compass:
echo   mongodb+srv://devgroupentreprise_db_user:LWC5S7GRgfB2KN84@cluster-dga-1.xylzvke.mongodb.net/
echo.
pause
