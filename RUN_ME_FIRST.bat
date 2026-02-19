@echo off
chcp 65001 > nul
cls

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║         Bienvenue sur MBolo Platform! 🎉                  ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo Ce script va installer et configurer MBolo automatiquement.
echo.
echo ⏱️  Durée estimée: 2-3 minutes
echo.
echo 📋 Prérequis:
echo    ✓ Docker Desktop (installé et démarré)
echo    ✓ Node.js 18+
echo    ✓ Connexion Internet
echo.
echo.
pause
echo.
echo 🚀 Lancement de l'installation...
echo.

call install.bat

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║         Installation terminée! ✅                          ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 💻 Pour démarrer le frontend:
echo    npm run dev
echo.
echo 🌐 Puis ouvrez:
echo    http://localhost:5173
echo.
echo 🔐 Identifiants de test:
echo    Username: testuser
echo    Password: test123
echo.
echo 📚 Documentation:
echo    START_HERE.md
echo    WINDOWS_QUICK_START.md
echo.
pause
