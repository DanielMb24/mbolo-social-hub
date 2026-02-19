@echo off
echo ========================================
echo LOGS AUTH SERVICE
echo ========================================
echo.
docker logs --tail 50 mbolo-auth
echo.
pause
