@echo off
echo ========================================
echo NETTOYAGE DES POSTS ORPHELINS
echo ========================================
echo.
echo Ce script va supprimer les posts dont les auteurs n'existent plus.
echo.
pause

node clean-orphan-posts.js

echo.
pause
