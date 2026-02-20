@echo off
chcp 65001 >nul
cls
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║   🚀 LANCEMENT DE MBOLO - TOUTES FONCTIONNALITÉS ACTIVES     ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo ✅ Messagerie en temps réel (WebSocket)
echo ✅ Réinitialisation mot de passe (OTP par email)
echo ✅ Connexion Google OAuth
echo ✅ Interface responsive mobile
echo.
echo ═══════════════════════════════════════════════════════════════
echo.

REM Vérifier si l'email est configuré
findstr /C:"ton_email@gmail.com" backend\.env >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  ATTENTION: Email non configuré !
    echo.
    echo Pour tester la réinitialisation de mot de passe :
    echo 1. Ouvrez backend\.env
    echo 2. Remplacez "ton_email@gmail.com" par votre email
    echo 3. Remplacez "ton_mot_de_passe_application" par votre mot de passe d'app Gmail
    echo.
    echo 📖 Guide: https://myaccount.google.com/apppasswords
    echo.
    echo Voulez-vous continuer quand même ? (O/N)
    set /p continue=
    if /i not "%continue%"=="O" (
        echo.
        echo ❌ Lancement annulé
        echo.
        pause
        exit /b
    )
)

echo.
echo [1/3] Démarrage des services backend...
echo.
cd backend
docker-compose up -d
if %errorlevel% neq 0 (
    echo.
    echo ❌ Erreur lors du démarrage du backend
    echo.
    pause
    exit /b 1
)
cd ..

echo.
echo ✅ Backend démarré !
echo.
echo [2/3] Attente de l'initialisation des services (10 secondes)...
timeout /t 10 /nobreak >nul

echo.
echo [3/3] Démarrage du frontend...
echo.
echo 🌐 Le navigateur va s'ouvrir sur http://localhost:5173
echo.
echo ═══════════════════════════════════════════════════════════════
echo.
echo 📋 SERVICES ACTIFS :
echo.
echo   • API Gateway      : http://localhost:8080
echo   • Auth Service     : http://localhost:8081
echo   • User Service     : http://localhost:8082
echo   • Chat Service     : http://localhost:8083
echo   • Post Service     : http://localhost:8084
echo   • Video Service    : http://localhost:8085
echo   • Moderation       : http://localhost:8086
echo.
echo   • Frontend         : http://localhost:5173
echo.
echo ═══════════════════════════════════════════════════════════════
echo.
echo 🧪 COMMENT TESTER :
echo.
echo 1. Messagerie en temps réel :
echo    → Connectez-vous → Messages → Les conversations se chargent
echo.
echo 2. Réinitialisation mot de passe :
echo    → Page connexion → "Mot de passe oublié ?" → Entrez email
echo    → Vérifiez votre boîte email pour le code OTP
echo.
echo 3. Connexion Google :
echo    → Page connexion → "Continuer avec Google"
echo.
echo 4. Responsive mobile :
echo    → F12 → Mode mobile (Ctrl+Shift+M)
echo.
echo ═══════════════════════════════════════════════════════════════
echo.
echo 📖 Documentation complète : TOUT_FONCTIONNE.md
echo.
echo ═══════════════════════════════════════════════════════════════
echo.

REM Démarrer le frontend
start cmd /k "npm run dev"

echo.
echo ✅ Tout est lancé !
echo.
echo Pour arrêter :
echo   • Fermez la fenêtre du frontend (Ctrl+C)
echo   • Lancez: cd backend ^&^& docker-compose down
echo.
pause
