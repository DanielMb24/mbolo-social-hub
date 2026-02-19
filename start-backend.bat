@echo off
echo Starting MBolo Backend...

cd backend

REM Check if .env exists
if not exist .env (
    echo Creating .env file...
    copy .env.example .env
)

REM Start services
echo Starting Docker containers...
docker-compose up -d

REM Wait for services
echo Waiting for services to start...
timeout /t 10 /nobreak > nul

REM Check status
echo.
echo Service Status:
docker-compose ps

echo.
echo Backend started!
echo.
echo Useful URLs:
echo    - API Gateway: http://localhost:8080
echo    - MinIO Console: http://localhost:9001 (mbolo_admin / mbolo_secret_2025)
echo.
echo To view logs: cd backend ^&^& docker-compose logs -f
echo To stop: cd backend ^&^& docker-compose down

pause
