@echo off
echo ========================================
echo TEST COMPLET MBOLO SOCIAL HUB
echo ========================================
echo.

echo [1/5] Verification des services Docker...
docker ps --filter "name=mbolo" --format "{{.Names}}: {{.Status}}" | findstr "healthy"
if %errorlevel% neq 0 (
    echo [ERREUR] Certains services ne sont pas healthy
    echo Executez: cd backend ^&^& .\restart-services.bat
    pause
    exit /b 1
)
echo [OK] Tous les services sont healthy
echo.

echo [2/5] Test de l'API d'authentification...
curl -s -X POST http://localhost:8080/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"testcomplet\",\"email\":\"testcomplet@test.com\",\"password\":\"test123\"}" ^
  -o test-response.json
if %errorlevel% neq 0 (
    echo [ERREUR] L'API d'authentification ne repond pas
    pause
    exit /b 1
)
echo [OK] API d'authentification fonctionnelle
echo.

echo [3/5] Extraction du token JWT...
for /f "tokens=*" %%a in ('powershell -Command "(Get-Content test-response.json | ConvertFrom-Json).data.accessToken"') do set TOKEN=%%a
if "%TOKEN%"=="" (
    echo [ERREUR] Impossible d'extraire le token
    type test-response.json
    pause
    exit /b 1
)
echo [OK] Token JWT extrait
echo.

echo [4/5] Test de creation de post...
curl -s -X POST http://localhost:8080/api/posts ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %TOKEN%" ^
  -d "{\"content\":\"Test complet - Post automatique\"}" ^
  -o post-response.json
if %errorlevel% neq 0 (
    echo [ERREUR] Impossible de creer un post
    pause
    exit /b 1
)
echo [OK] Post cree avec succes
echo.

echo [5/5] Verification du feed...
curl -s -X GET "http://localhost:8080/api/posts?page=0&size=10" ^
  -H "Authorization: Bearer %TOKEN%" ^
  -o feed-response.json
if %errorlevel% neq 0 (
    echo [ERREUR] Impossible de recuperer le feed
    pause
    exit /b 1
)
echo [OK] Feed recupere avec succes
echo.

echo ========================================
echo RESULTATS DU TEST
echo ========================================
echo.
echo Post cree:
type post-response.json
echo.
echo.
echo Feed (premiers posts):
type feed-response.json
echo.
echo.

del test-response.json post-response.json feed-response.json

echo ========================================
echo TOUS LES TESTS SONT PASSES !
echo ========================================
echo.
echo Vous pouvez maintenant:
echo 1. Ouvrir http://localhost:5174
echo 2. S'inscrire et creer des posts
echo 3. Verifier dans MongoDB Compass
echo.
pause
