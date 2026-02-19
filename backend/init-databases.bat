@echo off
echo Initialisation des bases de donnees MongoDB...

REM Attendre que MongoDB soit pret
timeout /t 5 /nobreak > nul

echo Creation des bases de donnees...

docker exec mbolo-mongo-auth mongosh --eval "use mbolo_auth; db.createCollection('users'); db.createCollection('refresh_tokens'); db.users.createIndex({ username: 1 }, { unique: true }); db.users.createIndex({ email: 1 }, { unique: true }); print('Auth database initialized');"

docker exec mbolo-mongo-user mongosh --eval "use mbolo_user; db.createCollection('user_profiles'); db.user_profiles.createIndex({ userId: 1 }, { unique: true }); db.user_profiles.createIndex({ username: 1 }, { unique: true }); print('User database initialized');"

docker exec mbolo-mongo-chat mongosh --eval "use mbolo_chat; db.createCollection('conversations'); db.createCollection('messages'); db.messages.createIndex({ conversationId: 1, timestamp: -1 }); db.conversations.createIndex({ participants: 1 }); print('Chat database initialized');"

docker exec mbolo-mongo-post mongosh --eval "use mbolo_post; db.createCollection('posts'); db.createCollection('comments'); db.posts.createIndex({ userId: 1, createdAt: -1 }); db.posts.createIndex({ createdAt: -1 }); db.comments.createIndex({ postId: 1, createdAt: -1 }); print('Post database initialized');"

docker exec mbolo-mongo-video mongosh --eval "use mbolo_video; db.createCollection('videos'); db.videos.createIndex({ userId: 1, createdAt: -1 }); db.videos.createIndex({ createdAt: -1 }); db.videos.createIndex({ views: -1 }); print('Video database initialized');"

docker exec mbolo-mongo-moderation mongosh --eval "use mbolo_moderation; db.createCollection('reports'); db.createCollection('banned_users'); db.createCollection('audit_logs'); db.reports.createIndex({ status: 1, createdAt: -1 }); db.banned_users.createIndex({ userId: 1 }, { unique: true }); db.audit_logs.createIndex({ createdAt: -1 }); print('Moderation database initialized');"

echo.
echo Bases de donnees initialisees avec succes!
echo.
echo Pour inserer des donnees de test:
echo    .\seed-test-data.bat
echo.
echo Pour verifier les bases:
echo    .\verify-databases.bat
echo.
pause
