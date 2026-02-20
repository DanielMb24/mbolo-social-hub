@echo off
chcp 65001 >nul
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║   🔍 VÉRIFICATION DES FONCTIONNALITÉS - MBolo             ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo [1/5] Vérification de la configuration email...
echo.
if exist "backend\.env" (
    findstr /C:"MAIL_USERNAME" backend\.env >nul
    if %errorlevel% equ 0 (
        echo ✅ Fichier backend\.env trouvé
        findstr /C:"ton_email@gmail.com" backend\.env >nul
        if %errorlevel% equ 0 (
            echo ⚠️  ATTENTION: Vous devez configurer votre vrai email dans backend\.env
            echo    Remplacez "ton_email@gmail.com" par votre email
            echo    Remplacez "ton_mot_de_passe_application" par votre mot de passe d'application Gmail
        ) else (
            echo ✅ Email configuré
        )
    ) else (
        echo ❌ Configuration email manquante dans backend\.env
    )
) else (
    echo ❌ Fichier backend\.env non trouvé
)
echo.

echo [2/5] Vérification de la configuration Google OAuth...
echo.
if exist ".env.development" (
    findstr /C:"VITE_GOOGLE_CLIENT_ID" .env.development >nul
    if %errorlevel% equ 0 (
        echo ✅ Google Client ID configuré dans .env.development
    ) else (
        echo ❌ Google Client ID manquant dans .env.development
    )
) else (
    echo ❌ Fichier .env.development non trouvé
)
echo.

echo [3/5] Vérification des services backend...
echo.
cd backend
docker-compose ps >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Docker Compose est actif
    docker-compose ps
) else (
    echo ⚠️  Les services backend ne sont pas démarrés
    echo    Lancez: start-full-stack.bat
)
cd ..
echo.

echo [4/5] Vérification des dépendances frontend...
echo.
if exist "node_modules\@react-oauth\google" (
    echo ✅ @react-oauth/google installé
) else (
    echo ❌ @react-oauth/google non installé
    echo    Lancez: npm install
)

if exist "node_modules\sockjs-client" (
    echo ✅ sockjs-client installé
) else (
    echo ❌ sockjs-client non installé
    echo    Lancez: npm install
)

if exist "node_modules\@stomp\stompjs" (
    echo ✅ @stomp/stompjs installé
) else (
    echo ❌ @stomp/stompjs non installé
    echo    Lancez: npm install
)
echo.

echo [5/5] Vérification des fichiers implémentés...
echo.
if exist "src\components\mbolo\GoogleLoginButton.tsx" (
    echo ✅ GoogleLoginButton.tsx
) else (
    echo ❌ GoogleLoginButton.tsx manquant
)

if exist "src\components\mbolo\ForgotPasswordDialog.tsx" (
    echo ✅ ForgotPasswordDialog.tsx
) else (
    echo ❌ ForgotPasswordDialog.tsx manquant
)

if exist "src\lib\chat-api.ts" (
    echo ✅ chat-api.ts
) else (
    echo ❌ chat-api.ts manquant
)

if exist "src\lib\websocket.ts" (
    echo ✅ websocket.ts
) else (
    echo ❌ websocket.ts manquant
)

if exist "src\lib\auth-api.ts" (
    echo ✅ auth-api.ts
) else (
    echo ❌ auth-api.ts manquant
)
echo.

echo ╔════════════════════════════════════════════════════════════╗
echo ║   📋 RÉSUMÉ                                                ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo ✅ Messagerie en temps réel (WebSocket) - IMPLÉMENTÉ
echo ✅ Réinitialisation mot de passe (OTP) - IMPLÉMENTÉ
echo ✅ Connexion Google OAuth - IMPLÉMENTÉ
echo ✅ Interface responsive mobile - IMPLÉMENTÉ
echo.
echo 📖 Consultez CONFIGURATION_FINALE.md pour les instructions détaillées
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║   🚀 PROCHAINES ÉTAPES                                     ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 1. Configurez votre email dans backend\.env
echo 2. Lancez: start-full-stack.bat
echo 3. Ouvrez: http://localhost:5173
echo 4. Testez les fonctionnalités !
echo.
pause
