@echo off
chcp 65001 > nul

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║         Vérification MongoDB - MBolo                       ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo 🔍 Vérification des conteneurs Docker...
docker ps --filter "name=mbolo-mongo" --format "table {{.Names}}\t{{.Status}}"

echo.
echo ════════════════════════════════════════════════════════════
echo 📊 Vérification de la base AUTH (mbolo_auth)
echo ════════════════════════════════════════════════════════════
docker exec mbolo-mongo-auth mongosh mbolo_auth --quiet --eval "print('Collections:'); db.getCollectionNames().forEach(c => print('  ✓ ' + c + ' (' + db[c].countDocuments() + ' documents)'));"

echo.
echo ════════════════════════════════════════════════════════════
echo 📊 Vérification de la base USER (mbolo_user)
echo ════════════════════════════════════════════════════════════
docker exec mbolo-mongo-user mongosh mbolo_user --quiet --eval "print('Collections:'); db.getCollectionNames().forEach(c => print('  ✓ ' + c + ' (' + db[c].countDocuments() + ' documents)'));"

echo.
echo ════════════════════════════════════════════════════════════
echo 📊 Vérification de la base POST (mbolo_post)
echo ════════════════════════════════════════════════════════════
docker exec mbolo-mongo-post mongosh mbolo_post --quiet --eval "print('Collections:'); db.getCollectionNames().forEach(c => print('  ✓ ' + c + ' (' + db[c].countDocuments() + ' documents)'));"

echo.
echo ════════════════════════════════════════════════════════════
echo 💡 EXPLICATION
echo ════════════════════════════════════════════════════════════
echo.
echo MongoDB n'a PAS de "tables" mais des "collections"
echo.
echo Si vous voyez des collections ci-dessus:
echo    ✅ Les bases sont créées et fonctionnelles
echo.
echo Si vous ne voyez RIEN:
echo    ❌ Les collections n'existent pas encore
echo    📝 Solution: Lancez .\init-databases.bat
echo.
echo Les collections seront aussi créées automatiquement
echo quand vous démarrerez les services Spring Boot!
echo.
pause
