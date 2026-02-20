@echo off
REM ==========================================
REM Script de Déploiement Render.com (Windows)
REM ==========================================

echo.
echo ========================================
echo   Deploiement MBolo Social Hub
echo   sur Render.com
echo ========================================
echo.

REM Verifier si git est installe
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Git n'est pas installe
    echo Installez Git depuis https://git-scm.com/download/win
    pause
    exit /b 1
)

echo [OK] Git est installe
echo.

REM Verifier si on est dans un repo git
if not exist .git (
    echo [INFO] Initialisation du repository git...
    git init
    echo [OK] Repository git initialise
)

REM Verifier les fichiers necessaires
echo ========================================
echo Verification des fichiers...
echo ========================================
echo.

set "files=Dockerfile nginx.conf render.yaml .dockerignore package.json"
for %%f in (%files%) do (
    if exist %%f (
        echo [OK] %%f existe
    ) else (
        echo [ERREUR] %%f manquant
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo Verification des Dockerfiles backend...
echo ========================================
echo.

set "services=api-gateway auth-service user-service chat-service post-service video-service moderation-service"
for %%s in (%services%) do (
    if exist backend\%%s\Dockerfile (
        echo [OK] backend\%%s\Dockerfile existe
    ) else (
        echo [ERREUR] backend\%%s\Dockerfile manquant
        pause
        exit /b 1
    )
)

REM Build test local (optionnel)
echo.
set /p build="Voulez-vous tester le build localement ? (o/n) "
if /i "%build%"=="o" (
    echo [INFO] Test du build frontend...
    call npm run build
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Build frontend reussi
    ) else (
        echo [ERREUR] Build frontend echoue
        pause
        exit /b 1
    )
)

REM Preparation du commit
echo.
echo ========================================
echo Preparation du commit...
echo ========================================
echo.

REM Ajouter tous les fichiers
git add .

REM Commit
set /p commit_msg="Message de commit (defaut: 'Pret pour deploiement Render'): "
if "%commit_msg%"=="" set commit_msg=Pret pour deploiement Render

git commit -m "%commit_msg%"
if %ERRORLEVEL% EQU 0 (
    echo [OK] Changements commites
) else (
    echo [INFO] Aucun changement a commiter
)

REM Verifier si un remote existe
git remote | findstr origin >nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Remote 'origin' existe
    echo.
    set /p push="Voulez-vous pousser vers GitHub ? (o/n) "
    if /i "!push!"=="o" (
        echo [INFO] Push vers GitHub...
        git push origin main
        if %ERRORLEVEL% NEQ 0 (
            git push origin master
        )
        echo [OK] Code pousse vers GitHub
    )
) else (
    echo [INFO] Aucun remote 'origin' configure
    echo.
    echo Pour ajouter un remote :
    echo   git remote add origin https://github.com/votre-username/mbolo-social-hub.git
    echo   git push -u origin main
)

REM Instructions finales
echo.
echo ========================================
echo   Preparation terminee !
echo ========================================
echo.
echo Prochaines etapes :
echo.
echo 1. Allez sur https://dashboard.render.com
echo 2. Cliquez sur 'New' -^> 'Blueprint'
echo 3. Selectionnez votre repository GitHub
echo 4. Render detectera automatiquement render.yaml
echo 5. Configurez les variables d'environnement :
echo    - MAIL_USERNAME
echo    - MAIL_PASSWORD
echo    - GOOGLE_CLIENT_ID
echo    - GOOGLE_CLIENT_SECRET
echo    - MINIO_ACCESS_KEY
echo    - MINIO_SECRET_KEY
echo    - JWT_SECRET
echo 6. Cliquez sur 'Apply'
echo.
echo Documentation complete : GUIDE_DEPLOIEMENT_RENDER.md
echo.
echo Bon deploiement !
echo.
pause
