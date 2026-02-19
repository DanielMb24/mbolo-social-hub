@echo off
echo ========================================
echo TEST INSCRIPTION DIRECTE
echo ========================================
echo.

echo Test 1: Inscription via Auth Service (port 8081)
echo.
curl -X POST http://localhost:8081/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"testuser\",\"email\":\"test@mbolo.com\",\"password\":\"test123\"}" ^
  -v
echo.
echo.

echo Test 2: Inscription via API Gateway (port 8080)
echo.
curl -X POST http://localhost:8080/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"testuser2\",\"email\":\"test2@mbolo.com\",\"password\":\"test123\"}" ^
  -v
echo.
echo.

echo ========================================
echo Verification dans MongoDB Atlas
echo ========================================
echo Connectez-vous a Compass et verifiez mbolo_auth > userAuths
echo.
pause
