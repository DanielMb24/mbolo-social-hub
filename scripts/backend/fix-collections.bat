@echo off
chcp 65001 > nul

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║         Correction des Collections MongoDB                ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo 🔧 Création des collections manquantes...
echo.

echo 📦 Auth Database...
docker exec mbolo-mongo-auth mongosh mbolo_auth --eval "db.createCollection('users_auth'); db.users_auth.createIndex({ username: 1 }, { unique: true }); db.users_auth.createIndex({ email: 1 }, { unique: true }); print('✓ users_auth créée');"

echo 📦 User Database...
docker exec mbolo-mongo-user mongosh mbolo_user --eval "db.createCollection('user_profiles'); db.user_profiles.createIndex({ userId: 1 }, { unique: true }); print('✓ user_profiles créée');"

echo 📦 Chat Database...
docker exec mbolo-mongo-chat mongosh mbolo_chat --eval "db.createCollection('conversations'); db.createCollection('messages'); print('✓ conversations et messages créées');"

echo 📦 Post Database...
docker exec mbolo-mongo-post mongosh mbolo_post --eval "db.createCollection('posts'); db.createCollection('comments'); print('✓ posts et comments créées');"

echo 📦 Video Database...
docker exec mbolo-mongo-video mongosh mbolo_video --eval "db.createCollection('videos'); print('✓ videos créée');"

echo 📦 Moderation Database...
docker exec mbolo-mongo-moderation mongosh mbolo_moderation --eval "db.createCollection('reports'); db.createCollection('banned_users'); db.createCollection('audit_logs'); print('✓ reports, banned_users et audit_logs créées');"

echo.
echo ✅ Collections créées avec succès!
echo.
echo 🔍 Vérification:
docker exec mbolo-mongo-video mongosh mbolo_video --eval "db.getCollectionNames()"

echo.
echo 💡 Rafraîchissez MongoDB Compass pour voir les collections!
echo.
pause
