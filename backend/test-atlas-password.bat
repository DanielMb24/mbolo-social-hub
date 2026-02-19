@echo off
echo ========================================
echo TEST DE CONNEXION MONGODB ATLAS
echo ========================================
echo.

echo Mot de passe actuel dans les fichiers de config:
findstr "mongodb+srv" auth-service\src\main\resources\application-docker.yml
echo.

echo ========================================
echo INSTRUCTIONS:
echo ========================================
echo.
echo 1. Allez sur MongoDB Atlas: https://cloud.mongodb.com/
echo.
echo 2. Cliquez sur "Database Access" dans le menu de gauche
echo.
echo 3. Trouvez l'utilisateur "devgroupentreprise_db_user"
echo.
echo 4. Si necessaire, cliquez sur "Edit" puis "Edit Password"
echo.
echo 5. Notez le mot de passe ou generez-en un nouveau
echo.
echo 6. L'URI complete sera:
echo    mongodb+srv://devgroupentreprise_db_user:VOTRE_MOT_DE_PASSE@cluster-dga-1.xylzvke.mongodb.net/
echo.
echo 7. Testez la connexion dans MongoDB Compass avec cette URI
echo.
echo ========================================
echo MOT DE PASSE ACTUEL DANS LE CODE:
echo ========================================
echo LWC5S7GRgfB2KN84
echo.
echo Si ce mot de passe est incorrect, dites-moi le bon mot de passe
echo et je mettrai a jour tous les fichiers de configuration.
echo.
pause
