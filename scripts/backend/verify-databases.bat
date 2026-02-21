@echo off
chcp 65001 > nul

echo Verification des bases de donnees MongoDB...
echo.

echo === Auth Database ===
docker exec mbolo-mongo-auth mongosh mbolo_auth --quiet --eval "print('Collections:'); db.getCollectionNames().forEach(c => { print('  - ' + c + ': ' + db[c].countDocuments() + ' documents'); });"

echo.
echo === User Database ===
docker exec mbolo-mongo-user mongosh mbolo_user --quiet --eval "print('Collections:'); db.getCollectionNames().forEach(c => { print('  - ' + c + ': ' + db[c].countDocuments() + ' documents'); });"

echo.
echo === Chat Database ===
docker exec mbolo-mongo-chat mongosh mbolo_chat --quiet --eval "print('Collections:'); db.getCollectionNames().forEach(c => { print('  - ' + c + ': ' + db[c].countDocuments() + ' documents'); });"

echo.
echo === Post Database ===
docker exec mbolo-mongo-post mongosh mbolo_post --quiet --eval "print('Collections:'); db.getCollectionNames().forEach(c => { print('  - ' + c + ': ' + db[c].countDocuments() + ' documents'); });"

echo.
echo === Video Database ===
docker exec mbolo-mongo-video mongosh mbolo_video --quiet --eval "print('Collections:'); db.getCollectionNames().forEach(c => { print('  - ' + c + ': ' + db[c].countDocuments() + ' documents'); });"

echo.
echo === Moderation Database ===
docker exec mbolo-mongo-moderation mongosh mbolo_moderation --quiet --eval "print('Collections:'); db.getCollectionNames().forEach(c => { print('  - ' + c + ': ' + db[c].countDocuments() + ' documents'); });"

echo.
echo Verification terminee
echo.
echo Pour se connecter a une base:
echo    docker exec -it mbolo-mongo-auth mongosh mbolo_auth
echo.
pause
