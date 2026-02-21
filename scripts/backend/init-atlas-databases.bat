@echo off
echo ========================================
echo CREATION DES BASES MONGODB ATLAS
echo ========================================
echo.

set ATLAS_URI=mongodb+srv://devgroupentreprise_db_user:LWC5S7GRgfB2KN84@cluster-dga-1.xylzvke.mongodb.net

echo Creation des 6 bases de donnees MBolo sur Atlas...
echo.

echo [1/6] Creation de mbolo_auth...
docker run --rm mongo:7 mongosh "%ATLAS_URI%/mbolo_auth" --eval "db.createCollection('userAuths'); db.createCollection('refreshTokens'); print('✓ mbolo_auth cree')" --quiet

echo [2/6] Creation de mbolo_user...
docker run --rm mongo:7 mongosh "%ATLAS_URI%/mbolo_user" --eval "db.createCollection('userProfiles'); print('✓ mbolo_user cree')" --quiet

echo [3/6] Creation de mbolo_chat...
docker run --rm mongo:7 mongosh "%ATLAS_URI%/mbolo_chat" --eval "db.createCollection('conversations'); db.createCollection('messages'); print('✓ mbolo_chat cree')" --quiet

echo [4/6] Creation de mbolo_post...
docker run --rm mongo:7 mongosh "%ATLAS_URI%/mbolo_post" --eval "db.createCollection('posts'); db.createCollection('comments'); print('✓ mbolo_post cree')" --quiet

echo [5/6] Creation de mbolo_video...
docker run --rm mongo:7 mongosh "%ATLAS_URI%/mbolo_video" --eval "db.createCollection('videos'); print('✓ mbolo_video cree')" --quiet

echo [6/6] Creation de mbolo_moderation...
docker run --rm mongo:7 mongosh "%ATLAS_URI%/mbolo_moderation" --eval "db.createCollection('reports'); db.createCollection('bannedUsers'); db.createCollection('auditLogs'); print('✓ mbolo_moderation cree')" --quiet

echo.
echo ========================================
echo VERIFICATION DES BASES CREEES
echo ========================================
echo.
docker run --rm mongo:7 mongosh "%ATLAS_URI%/" --eval "db.adminCommand('listDatabases').databases.forEach(function(db) { if(db.name.startsWith('mbolo_')) print('✓ ' + db.name); })" --quiet

echo.
echo ========================================
echo SUCCES!
echo ========================================
echo.
echo Toutes les bases ont ete creees sur Atlas.
echo.
echo Prochaines etapes:
echo 1. Rafraichissez MongoDB Compass
echo 2. Vous verrez les 6 bases: mbolo_auth, mbolo_user, mbolo_chat, mbolo_post, mbolo_video, mbolo_moderation
echo 3. Reconstruisez les services: .\rebuild-services.bat
echo 4. Testez l'API: .\test-api-direct.bat
echo.
pause
