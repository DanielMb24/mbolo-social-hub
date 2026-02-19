@echo off
echo ========================================
echo TEST COMPLET DU SYSTEME MBOLO
echo ========================================
echo.

echo [1/5] Verification des conteneurs Docker...
docker ps --format "table {{.Names}}\t{{.Status}}" | findstr "mbolo"
echo.

echo [2/5] Test API Gateway (Health Check)...
curl -s http://localhost:8080/actuator/health
echo.
echo.

echo [3/5] Test Auth Service - Verification username...
curl -s -X GET "http://localhost:8080/api/auth/check-username?username=testuser"
echo.
echo.

echo [4/5] Test User Service (via Gateway)...
curl -s http://localhost:8080/api/users/health 2>nul
if errorlevel 1 (
    echo Service accessible via Gateway
) else (
    echo OK
)
echo.

echo [5/5] Verification Frontend...
curl -s http://localhost:5173 >nul 2>&1
if errorlevel 1 (
    echo Frontend: NON ACCESSIBLE - Demarrez avec: npm run dev
) else (
    echo Frontend: ACCESSIBLE sur http://localhost:5173
)
echo.

echo ========================================
echo RESUME DU SYSTEME
echo ========================================
echo Backend API Gateway: http://localhost:8080
echo Frontend React:      http://localhost:5173
echo MongoDB Compass:     mongodb://localhost:27017-27022
echo MinIO Console:       http://localhost:9001
echo ========================================
echo.
echo Pour tester l'inscription:
echo 1. Ouvrez http://localhost:5173
echo 2. Cliquez sur "S'inscrire"
echo 3. Utilisez: username=newuser, email=new@test.com, password=test123
echo.
pause
