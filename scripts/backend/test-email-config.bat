@echo off
echo ========================================
echo Test de la configuration Email
echo ========================================
echo.

set /p EMAIL="Entrez votre adresse email pour le test: "

echo.
echo Envoi d'une demande de reinitialisation de mot de passe...
echo.

curl -X POST http://localhost:8081/api/auth/forgot-password ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"%EMAIL%\"}"

echo.
echo.
echo ========================================
echo Verification des logs du service...
echo ========================================
echo.

docker logs --tail 50 mbolo-auth-service

echo.
echo ========================================
echo Test termine !
echo ========================================
echo.
echo Si vous avez recu un email, la configuration est correcte.
echo Sinon, verifiez les logs ci-dessus pour identifier le probleme.
echo.
pause
