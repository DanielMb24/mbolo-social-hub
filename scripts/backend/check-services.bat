@echo off
echo ========================================
echo VERIFICATION DES SERVICES DOCKER
echo ========================================
echo.

cd /d "%~dp0"

echo [1] Etat des conteneurs:
docker-compose ps
echo.

echo ========================================
echo [2] Services en cours d'execution:
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.

echo ========================================
echo [3] Logs API Gateway (20 dernieres lignes):
echo ========================================
docker logs --tail 20 mbolo-gateway 2>&1
echo.

echo ========================================
echo [4] Logs Auth Service (20 dernieres lignes):
echo ========================================
docker logs --tail 20 mbolo-auth 2>&1
echo.

echo ========================================
echo ACTIONS POSSIBLES:
echo ========================================
echo.
echo Si les services ne sont pas demarres:
echo   docker-compose up -d
echo.
echo Pour redemarrer un service specifique:
echo   docker-compose restart mbolo-auth
echo   docker-compose restart mbolo-gateway
echo.
echo Pour voir les logs en temps reel:
echo   docker-compose logs -f mbolo-auth
echo.
pause
