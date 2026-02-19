@echo off
echo ========================================
echo Rebuild User Service
echo ========================================
echo.

cd user-service

echo Cleaning...
call mvn clean

echo Building...
call mvn package -DskipTests

echo.
echo ========================================
echo Build complete!
echo ========================================
echo.
echo Now restart services with: ..\restart-services.bat
pause
