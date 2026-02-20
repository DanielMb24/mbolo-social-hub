@echo off
echo Installation des dependances pour la messagerie en temps reel...
echo.

cd %~dp0

echo Installation de SockJS et STOMP pour WebSocket...
call npm install sockjs-client @stomp/stompjs
call npm install --save-dev @types/sockjs-client

echo.
echo ========================================
echo Installation terminee !
echo ========================================
echo.
echo Les dependances suivantes ont ete installees :
echo - sockjs-client : Client WebSocket
echo - @stomp/stompjs : Protocol STOMP pour messaging
echo.
pause
