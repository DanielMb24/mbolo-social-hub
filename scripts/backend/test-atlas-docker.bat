@echo off
echo ========================================
echo TEST CONNEXION ATLAS AVEC DOCKER
echo ========================================
echo.

echo Utilisation d'un conteneur MongoDB pour tester...
echo.

docker run --rm mongo:7 mongosh "mongodb+srv://devgroupentreprise_db_user:LWC5S7GRgfB2KN84@cluster-dga-1.xylzvke.mongodb.net/" --eval "db.adminCommand('ping')"

if errorlevel 1 (
    echo.
    echo [ERREUR] Connexion echouee
    echo.
    echo Verifications necessaires:
    echo.
    echo 1. Allez sur: https://cloud.mongodb.com/
    echo 2. Cliquez sur "Network Access" dans le menu
    echo 3. Ajoutez votre IP ou autorisez "0.0.0.0/0" (toutes les IPs)
    echo 4. Cliquez sur "Database Access"
    echo 5. Verifiez que l'utilisateur "devgroupentreprise_db_user" existe
    echo 6. Verifiez que le mot de passe est "devgroupentreprise_db_user"
    echo.
) else (
    echo.
    echo ========================================
    echo [SUCCESS] CONNEXION REUSSIE!
    echo ========================================
    echo.
    echo Liste des bases de donnees:
    docker run --rm mongo:7 mongosh "mongodb+srv://devgroupentreprise_db_user:LWC5S7GRgfB2KN84@cluster-dga-1.xylzvke.mongodb.net/" --eval "show dbs" --quiet
    echo.
    echo Test d'ecriture dans mbolo_test:
    docker run --rm mongo:7 mongosh "mongodb+srv://devgroupentreprise_db_user:LWC5S7GRgfB2KN84@cluster-dga-1.xylzvke.mongodb.net/mbolo_test" --eval "db.test.insertOne({test: 'OK', date: new Date()})" --quiet
    echo.
    echo ========================================
    echo TOUT FONCTIONNE!
    echo ========================================
    echo.
    echo Vous pouvez maintenant:
    echo 1. Rafraichir MongoDB Compass
    echo 2. Voir la base "mbolo_test"
    echo 3. Reconstruire les services: .\rebuild-services.bat
    echo.
)

pause
