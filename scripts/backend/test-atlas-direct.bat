@echo off
echo ========================================
echo TEST CONNEXION DIRECTE MONGODB ATLAS
echo ========================================
echo.

echo URI de connexion:
echo mongodb+srv://devgroupentreprise_db_user:devgroupentreprise_db_user@cluster-dga-1.xylzvke.mongodb.net/
echo.

echo ========================================
echo Test 1: Connexion avec mongosh
echo ========================================
echo.

mongosh "mongodb+srv://devgroupentreprise_db_user:devgroupentreprise_db_user@cluster-dga-1.xylzvke.mongodb.net/" --eval "db.adminCommand('ping')"

if errorlevel 1 (
    echo.
    echo [ERREUR] Impossible de se connecter a Atlas
    echo.
    echo Verifications:
    echo 1. Le mot de passe est-il correct?
    echo 2. Votre IP est-elle autorisee dans Atlas Network Access?
    echo    https://cloud.mongodb.com/v2#/security/network/accessList
    echo 3. L'utilisateur existe-t-il dans Database Access?
    echo    https://cloud.mongodb.com/v2#/security/database/users
    echo.
) else (
    echo.
    echo [SUCCESS] Connexion a Atlas reussie!
    echo.
    echo Test 2: Liste des bases de donnees
    echo ========================================
    mongosh "mongodb+srv://devgroupentreprise_db_user:devgroupentreprise_db_user@cluster-dga-1.xylzvke.mongodb.net/" --eval "show dbs"
    echo.
    echo.
    echo Test 3: Creation d'une base de test
    echo ========================================
    mongosh "mongodb+srv://devgroupentreprise_db_user:devgroupentreprise_db_user@cluster-dga-1.xylzvke.mongodb.net/mbolo_test" --eval "db.test_collection.insertOne({test: 'connexion reussie', date: new Date()})"
    echo.
    echo.
    echo [SUCCESS] Tous les tests passes!
    echo Vous pouvez maintenant reconstruire les services Docker.
    echo.
)

pause
