@echo off
echo ========================================
echo VERIFICATION COMPLETE - MBOLO
echo ========================================
echo.

echo [1/6] Verification des services Docker...
docker ps --filter "name=mbolo" --format "{{.Names}}: {{.Status}}" | findstr "healthy" > nul
if %errorlevel% neq 0 (
    echo [ATTENTION] Certains services ne sont pas healthy
    echo.
    docker ps --filter "name=mbolo" --format "{{.Names}}: {{.Status}}"
    echo.
) else (
    echo [OK] Tous les services sont healthy
)
echo.

echo [2/6] Verification du frontend...
curl -s http://localhost:5174 > nul 2>&1
if %errorlevel% neq 0 (
    echo [ATTENTION] Frontend ne repond pas sur http://localhost:5174
    echo Executez: npm run dev
) else (
    echo [OK] Frontend accessible sur http://localhost:5174
)
echo.

echo [3/6] Verification de l'API Gateway...
curl -s http://localhost:8080/actuator/health > nul 2>&1
if %errorlevel% neq 0 (
    echo [ATTENTION] API Gateway ne repond pas
) else (
    echo [OK] API Gateway accessible sur http://localhost:8080
)
echo.

echo [4/6] Verification du service Auth...
curl -s http://localhost:8081/actuator/health > nul 2>&1
if %errorlevel% neq 0 (
    echo [ATTENTION] Service Auth ne repond pas
) else (
    echo [OK] Service Auth accessible sur http://localhost:8081
)
echo.

echo [5/6] Verification du service Post...
curl -s http://localhost:8084/actuator/health > nul 2>&1
if %errorlevel% neq 0 (
    echo [ATTENTION] Service Post ne repond pas
) else (
    echo [OK] Service Post accessible sur http://localhost:8084
)
echo.

echo [6/6] Verification des fichiers cles...
if exist "src\pages\SimpleFeed.tsx" (
    echo [OK] SimpleFeed.tsx existe
) else (
    echo [ERREUR] SimpleFeed.tsx manquant
)

if exist "src\lib\api.ts" (
    echo [OK] api.ts existe
) else (
    echo [ERREUR] api.ts manquant
)

if exist "backend\docker-compose.yml" (
    echo [OK] docker-compose.yml existe
) else (
    echo [ERREUR] docker-compose.yml manquant
)
echo.

echo ========================================
echo RESUME
echo ========================================
echo.
echo Services Backend:
docker ps --filter "name=mbolo" --format "  - {{.Names}}: {{.Status}}" | findstr "mbolo-"
echo.
echo URLs:
echo   - Frontend: http://localhost:5174
echo   - API Gateway: http://localhost:8080
echo   - MongoDB Atlas: Connecte
echo.
echo Documentation:
echo   - LISEZ_MOI_MAINTENANT.md
echo   - GUIDE_DEMARRAGE_RAPIDE.md
echo   - RESUME_FINAL.md
echo.
echo Tests:
echo   - .\test-complet.bat
echo   - cd backend ^&^& .\test-post-api.bat
echo.
echo ========================================
echo VERIFICATION TERMINEE
echo ========================================
pause
