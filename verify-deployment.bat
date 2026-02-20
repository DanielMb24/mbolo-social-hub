@echo off
REM ==========================================
REM Script de Verification du Deploiement
REM ==========================================

echo.
echo ========================================
echo   Verification du Deploiement
echo   MBolo Social Hub sur Render
echo ========================================
echo.

REM Verifier si curl est disponible
where curl >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] curl n'est pas installe
    echo Installez curl ou utilisez PowerShell
    pause
    exit /b 1
)

REM Configuration
set "BASE_URL=https://mbolo"
set "FRONTEND_URL=%BASE_URL%-frontend.onrender.com"
set "GATEWAY_URL=%BASE_URL%-gateway.onrender.com"
set "AUTH_URL=%BASE_URL%-auth.onrender.com"
set "USER_URL=%BASE_URL%-user.onrender.com"
set "CHAT_URL=%BASE_URL%-chat.onrender.com"
set "POST_URL=%BASE_URL%-post.onrender.com"
set "VIDEO_URL=%BASE_URL%-video.onrender.com"
set "MODERATION_URL=%BASE_URL%-moderation.onrender.com"

echo ========================================
echo Verification du Frontend
echo ========================================
echo.
echo URL: %FRONTEND_URL%
curl -s -o nul -w "Status: %%{http_code}\n" %FRONTEND_URL%/health
echo.

echo ========================================
echo Verification de l'API Gateway
echo ========================================
echo.
echo URL: %GATEWAY_URL%
curl -s %GATEWAY_URL%/actuator/health
echo.
echo.

echo ========================================
echo Verification de l'Auth Service
echo ========================================
echo.
echo URL: %AUTH_URL%
curl -s %AUTH_URL%/actuator/health
echo.
echo.

echo ========================================
echo Verification du User Service
echo ========================================
echo.
echo URL: %USER_URL%
curl -s %USER_URL%/actuator/health
echo.
echo.

echo ========================================
echo Verification du Chat Service
echo ========================================
echo.
echo URL: %CHAT_URL%
curl -s %CHAT_URL%/actuator/health
echo.
echo.

echo ========================================
echo Verification du Post Service
echo ========================================
echo.
echo URL: %POST_URL%
curl -s %POST_URL%/actuator/health
echo.
echo.

echo ========================================
echo Verification du Video Service
echo ========================================
echo.
echo URL: %VIDEO_URL%
curl -s %VIDEO_URL%/actuator/health
echo.
echo.

echo ========================================
echo Verification du Moderation Service
echo ========================================
echo.
echo URL: %MODERATION_URL%
curl -s %MODERATION_URL%/actuator/health
echo.
echo.

echo ========================================
echo   Verification terminee !
echo ========================================
echo.
echo Si tous les services retournent "UP", le deploiement est reussi !
echo.
echo Pour tester l'application complete :
echo   Ouvrez %FRONTEND_URL% dans votre navigateur
echo.
pause
