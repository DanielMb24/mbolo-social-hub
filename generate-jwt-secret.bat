@echo off
REM ==========================================
REM Generateur de JWT Secret Securise
REM ==========================================

echo.
echo ========================================
echo   Generateur de JWT Secret
echo ========================================
echo.

REM Verifier si PowerShell est disponible
where powershell >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] PowerShell n'est pas disponible
    pause
    exit /b 1
)

echo Generation d'un secret JWT securise...
echo.

REM Generer un secret de 64 caracteres (256 bits)
powershell -Command "$bytes = New-Object byte[] 32; (New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes); [Convert]::ToBase64String($bytes)"

echo.
echo ========================================
echo   Secret JWT genere !
echo ========================================
echo.
echo Copiez le secret ci-dessus et utilisez-le pour :
echo   - JWT_SECRET dans .env.render
echo   - GATEWAY_JWT_SECRET
echo   - AUTH_JWT_SECRET
echo.
echo IMPORTANT : Utilisez le MEME secret pour tous les services
echo.
pause
