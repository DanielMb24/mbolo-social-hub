@echo off
chcp 65001 > nul

echo Insertion de donnees de test...
echo.

REM Attendre que les bases soient pretes
timeout /t 5 /nobreak > nul

REM Inserer un utilisateur de test
echo Creation d'un utilisateur de test...
docker exec mbolo-mongo-auth mongosh mbolo_auth --eval "db.users_auth.insertOne({ username: 'testuser', email: 'test@mbolo.com', password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIpSRelgyG', fullName: 'Test User', phone: '+1234567890', roles: ['ROLE_USER'], isActive: true, isVerified: true, createdAt: new Date() }); print('Utilisateur de test cree: testuser / test123');"

REM Inserer un profil utilisateur
echo Creation du profil utilisateur...
docker exec mbolo-mongo-user mongosh mbolo_user --eval "db.user_profiles.insertOne({ userId: '1', username: 'testuser', fullname: 'Test User', bio: 'Utilisateur de test pour MBolo', location: 'Paris, France', avatarUrl: null, followersCount: 0, followingCount: 0, postsCount: 0, blockedUsers: [], createdAt: new Date() }); print('Profil utilisateur cree');"

REM Inserer des posts de test
echo Creation de posts de test...
docker exec mbolo-mongo-post mongosh mbolo_post --eval "db.posts.insertMany([{ userId: '1', content: 'Bienvenue sur MBolo! Ceci est mon premier post.', mediaUrls: [], likes: 0, comments: 0, createdAt: new Date(), updatedAt: new Date() }, { userId: '1', content: 'Test de la plateforme sociale. Tout fonctionne parfaitement!', mediaUrls: [], likes: 0, comments: 0, createdAt: new Date(), updatedAt: new Date() }]); print('Posts de test crees');"

echo.
echo Donnees de test inserees avec succes!
echo.
echo Identifiants de test:
echo    Username: testuser
echo    Email: test@mbolo.com
echo    Password: test123
echo.
echo Utilisez ces identifiants pour vous connecter sur http://localhost:5173
echo.
pause
