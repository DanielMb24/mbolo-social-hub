@echo off
echo ========================================
echo Nettoyage des Messages avec Medias Manquants
echo ========================================
echo.

node clean-orphan-media.cjs

echo.
echo ========================================
echo Nettoyage termine!
echo ========================================
pause
