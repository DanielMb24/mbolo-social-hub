@echo off
echo ========================================
echo Demarrage de Mbolo avec Messagerie
echo ========================================
echo.

echo Etape 1/4 : Verification des dependances...
cd %~dp0

if not exist "node_modules\sockjs-client" (
    echo Installation des dependances WebSocket...
    call npm install sockjs-client @stomp/stompjs
    call npm install --save-dev @types/sockjs-client
) else (
    echo Dependances WebSocket deja installees.
)

echo.
echo Etape 2/4 : Demarrage des services backend...
cd backend
docker-compose up -d

echo.
echo Etape 3/4 : Attente du demarrage des services (30 secondes)...
timeout /t 30 /nobreak

echo.
echo Etape 4/4 : Verification des services...
docker ps

echo.
echo ========================================
echo Services demarres !
echo ========================================
echo.
echo Backend:
echo - API Gateway: http://localhost:8080
echo - Auth Service: http://localhost:8081
echo - Chat Service: http://localhost:8083
echo - WebSocket: ws://localhost:8083/ws-chat
echo.
echo Pour demarrer le frontend:
echo   npm run dev
echo.
echo Pour tester l'email:
echo   cd backend
echo   test-email-config.bat
echo.
echo Pour voir les logs:
echo   docker logs -f mbolo-auth-service
echo   docker logs -f mbolo-chat-service
echo.
pause
