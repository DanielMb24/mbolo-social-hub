@echo off
cls
echo ========================================
echo VERIFICATION COMPLETE - MBOLO
echo ========================================
echo.

set /a TOTAL=0
set /a OK=0
set /a WARN=0
set /a ERROR=0

echo [ETAPE 1/10] Docker...
docker --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Docker installe
    set /a OK+=1
) else (
    echo [ERREUR] Docker non installe
    set /a ERROR+=1
)
set /a TOTAL+=1

echo.
echo [ETAPE 2/10] Node.js...
node --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Node.js installe
    set /a OK+=1
) else (
    echo [ERREUR] Node.js non installe
    set /a ERROR+=1
)
set /a TOTAL+=1

echo.
echo [ETAPE 3/10] Dependances frontend...
if exist "node_modules" (
    echo [OK] node_modules existe
    set /a OK+=1
) else (
    echo [ATTENTION] Executer: npm install
    set /a WARN+=1
)
set /a TOTAL+=1

echo.
echo [ETAPE 4/10] Dependances WebSocket...
if exist "node_modules\sockjs-client" (
    echo [OK] sockjs-client installe
    set /a OK+=1
) else (
    echo [ATTENTION] Executer: install-chat-deps.bat
    set /a WARN+=1
)
set /a TOTAL+=1

echo.
echo [ETAPE 5/10] Dependances Google OAuth...
if exist "node_modules\@react-oauth" (
    echo [OK] @react-oauth/google installe
    set /a OK+=1
) else (
    echo [ATTENTION] Executer: install-google-oauth.bat
    set /a WARN+=1
)
set /a TOTAL+=1

echo.
echo [ETAPE 6/10] Configuration backend...
if exist "backend\.env" (
    echo [OK] Fichier backend/.env existe
    set /a OK+=1
    
    findstr /C:"MAIL_USERNAME" backend\.env >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo [OK] MAIL_USERNAME configure
    ) else (
        echo [ATTENTION] MAIL_USERNAME manquant
        set /a WARN+=1
    )
    
    findstr /C:"GOOGLE_CLIENT_ID" backend\.env >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo [OK] GOOGLE_CLIENT_ID configure
    ) else (
        echo [ATTENTION] GOOGLE_CLIENT_ID manquant
        set /a WARN+=1
    )
) else (
    echo [ATTENTION] Creer backend/.env
    set /a WARN+=1
)
set /a TOTAL+=1

echo.
echo [ETAPE 7/10] Fichiers backend crees...
set /a BACKEND_FILES=0
if exist "backend\auth-service\src\main\java\com\mbolo\auth\service\EmailService.java" set /a BACKEND_FILES+=1
if exist "backend\auth-service\src\main\java\com\mbolo\auth\service\GoogleAuthService.java" set /a BACKEND_FILES+=1
if exist "backend\chat-service\src\main\java\com\mbolo\chat\service\ChatService.java" set /a BACKEND_FILES+=1
echo [OK] %BACKEND_FILES%/3 fichiers backend presents
if %BACKEND_FILES% EQU 3 (
    set /a OK+=1
) else (
    set /a WARN+=1
)
set /a TOTAL+=1

echo.
echo [ETAPE 8/10] Fichiers frontend crees...
set /a FRONTEND_FILES=0
if exist "src\lib\auth-api.ts" set /a FRONTEND_FILES+=1
if exist "src\lib\chat-api.ts" set /a FRONTEND_FILES+=1
if exist "src\lib\websocket.ts" set /a FRONTEND_FILES+=1
if exist "src\components\mbolo\ForgotPasswordDialog.tsx" set /a FRONTEND_FILES+=1
if exist "src\components\mbolo\GoogleLoginButton.tsx" set /a FRONTEND_FILES+=1
echo [OK] %FRONTEND_FILES%/5 fichiers frontend presents
if %FRONTEND_FILES% EQU 5 (
    set /a OK+=1
) else (
    set /a WARN+=1
)
set /a TOTAL+=1

echo.
echo [ETAPE 9/10] Services Docker...
docker ps >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    docker ps | findstr "mbolo-auth" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Auth service demarre
        set /a OK+=1
    ) else (
        echo [INFO] Auth service non demarre
        echo        Executer: cd backend ^&^& docker-compose up -d
        set /a WARN+=1
    )
) else (
    echo [INFO] Docker daemon non accessible
    set /a WARN+=1
)
set /a TOTAL+=1

echo.
echo [ETAPE 10/10] Documentation...
set /a DOC_FILES=0
if exist "GUIDE_COMPLET_INSTALLATION.md" set /a DOC_FILES+=1
if exist "TOUT_EST_IMPLEMENTE.txt" set /a DOC_FILES+=1
if exist "INTEGRATION_ETAPES.txt" set /a DOC_FILES+=1
echo [OK] %DOC_FILES%/3 fichiers documentation presents
if %DOC_FILES% EQU 3 (
    set /a OK+=1
) else (
    set /a WARN+=1
)
set /a TOTAL+=1

echo.
echo ========================================
echo RESULTAT FINAL
echo ========================================
echo.
echo Total verifications: %TOTAL%
echo [OK] Reussi: %OK%
echo [ATTENTION] Avertissements: %WARN%
echo [ERREUR] Erreurs: %ERROR%
echo.

if %ERROR% GTR 0 (
    echo [ERREUR] Des problemes critiques ont ete detectes
    echo Consultez les messages ci-dessus
) else if %WARN% GTR 0 (
    echo [ATTENTION] Configuration incomplete
    echo.
    echo Actions recommandees:
    echo 1. Creer/completer backend/.env
    echo 2. Installer dependances: npm install
    echo 3. Installer WebSocket: install-chat-deps.bat
    echo 4. Installer Google OAuth: install-google-oauth.bat
    echo 5. Demarrer services: cd backend ^&^& docker-compose up -d
) else (
    echo ========================================
    echo [SUCCESS] TOUT EST PRET ! 🎉
    echo ========================================
    echo.
    echo Vous pouvez maintenant:
    echo 1. Demarrer: start-with-chat.bat
    echo 2. Tester email: cd backend ^&^& test-email-config.bat
    echo 3. Ouvrir: http://localhost:5173
)

echo.
echo Documentation complete:
echo - GUIDE_COMPLET_INSTALLATION.md
echo - TOUT_EST_IMPLEMENTE.txt
echo - INTEGRATION_ETAPES.txt
echo.
pause
