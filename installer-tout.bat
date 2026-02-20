@echo off
cls
echo ========================================
echo INSTALLATION COMPLETE - MBOLO
echo ========================================
echo.
echo Ce script va installer toutes les dependances necessaires.
echo.
pause

echo.
echo [1/4] Installation des dependances principales...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Installation npm echouee
    pause
    exit /b 1
)

echo.
echo [2/4] Installation des dependances WebSocket...
call npm install sockjs-client @stomp/stompjs
call npm install --save-dev @types/sockjs-client
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Installation WebSocket echouee
    pause
    exit /b 1
)

echo.
echo [3/4] Installation de Google OAuth...
call npm install @react-oauth/google
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Installation Google OAuth echouee
    pause
    exit /b 1
)

echo.
echo [4/4] Verification de Docker...
docker --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ATTENTION] Docker n'est pas installe ou demarre
    echo Veuillez installer Docker Desktop et le demarrer
) else (
    echo [OK] Docker est pret
)

echo.
echo ========================================
echo INSTALLATION TERMINEE !
echo ========================================
echo.
echo Prochaines etapes:
echo.
echo 1. Configurer backend/.env (5 min)
echo    - MAIL_USERNAME=votre-email@gmail.com
echo    - MAIL_PASSWORD=votre-mot-de-passe-app
echo    - GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET
echo.
echo 2. Demarrer l'application:
echo    start-with-chat.bat
echo.
echo 3. Lire la documentation:
echo    INSTRUCTIONS_FINALES.md
echo.
echo Documentation complete disponible dans:
echo - INSTRUCTIONS_FINALES.md (LIRE EN PREMIER)
echo - GUIDE_COMPLET_INSTALLATION.md
echo - TOUT_EST_IMPLEMENTE.txt
echo.
pause
