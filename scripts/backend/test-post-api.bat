@echo off
echo ========================================
echo TEST POST API
echo ========================================
echo.

echo 1. Inscription d'un utilisateur de test...
curl -X POST http://localhost:8080/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"testpost\",\"email\":\"testpost@test.com\",\"password\":\"test123\"}" ^
  -o response.json
echo.
echo.

echo 2. Extraction du token...
for /f "tokens=*" %%a in ('powershell -Command "(Get-Content response.json | ConvertFrom-Json).data.accessToken"') do set TOKEN=%%a
echo Token: %TOKEN%
echo.

echo 3. Creation d'un post...
curl -X POST http://localhost:8080/api/posts ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %TOKEN%" ^
  -d "{\"content\":\"Mon premier post de test!\"}"
echo.
echo.

echo 4. Recuperation du feed...
curl -X GET "http://localhost:8080/api/posts?page=0&size=10" ^
  -H "Authorization: Bearer %TOKEN%"
echo.
echo.

del response.json
echo ========================================
echo TEST TERMINE
echo ========================================
pause
