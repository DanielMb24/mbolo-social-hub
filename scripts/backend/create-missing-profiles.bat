@echo off
echo ========================================
echo CREATION DES PROFILS MANQUANTS
echo ========================================
echo.

echo [1] Recuperation de tous les utilisateurs depuis auth-service...
curl -s http://localhost:8081/actuator/health > nul 2>&1
if errorlevel 1 (
    echo ERREUR: Auth service n'est pas accessible
    pause
    exit /b 1
)

echo [2] Creation des profils pour les utilisateurs existants...
echo.

REM Recuperer les IDs des utilisateurs depuis MongoDB auth
docker exec mbolo-mongo-auth mongosh --quiet --eval "db.userAuths.find({}, {_id:1, username:1, email:1, fullName:1}).forEach(u => print(JSON.stringify(u)))" > temp_users.txt

echo Utilisateurs trouves:
type temp_users.txt
echo.

echo [3] Creation des profils via l'API...
REM Pour chaque utilisateur, creer un profil
for /f "tokens=*" %%i in (temp_users.txt) do (
    echo Traitement: %%i
    REM Extraire les donnees et creer le profil
    REM Note: Ceci necessite jq ou un parsing JSON plus sophistique
)

echo.
echo ========================================
echo TERMINE
echo ========================================
echo.
echo Note: Pour une creation complete, utilisez le script PowerShell
echo ou creez les profils manuellement via l'interface.
echo.

del temp_users.txt 2>nul

pause
