@echo off
echo ========================================
echo TEST ECRITURE MONGODB ATLAS
echo ========================================
echo.

set ATLAS_URI=mongodb+srv://devgroupentreprise_db_user:LWC5S7GRgfB2KN84@cluster-dga-1.xylzvke.mongodb.net

echo Test 1: Ecriture directe dans mbolo_auth
echo.
docker run --rm mongo:7 mongosh "%ATLAS_URI%/mbolo_auth" --eval "db.test_write.insertOne({test: 'write test', date: new Date()}); print('✓ Ecriture reussie'); db.test_write.find().forEach(printjson);" --quiet
echo.

echo ========================================
echo Test 2: Verification que les services voient Atlas
echo ========================================
echo.

echo Logs Auth Service (MongoDB):
docker logs mbolo-auth 2>&1 | findstr /i "mongodb cluster atlas connected" | Select-Object -Last 5
echo.

echo ========================================
echo Test 3: Variables d'environnement du conteneur
echo ========================================
docker exec mbolo-auth env | findstr MONGO
echo.

echo ========================================
echo RESULTAT:
echo ========================================
echo.
echo Si "Ecriture reussie" apparait, Atlas fonctionne.
echo Si les logs montrent "connected to server", Spring Boot voit Atlas.
echo.
echo Si ca ne fonctionne pas:
echo 1. Verifiez Network Access dans Atlas
echo 2. Verifiez que le mot de passe est correct
echo 3. Reconstruisez les services: .\rebuild-services.bat
echo.
pause
