@echo off
echo Starting MBolo (Backend + Frontend)...

REM Start backend
echo.
echo === BACKEND ===
cd backend

if not exist .env (
    copy .env.example .env
)

docker-compose up -d
cd ..

REM Wait for backend
echo Waiting for backend...
timeout /t 15 /nobreak > nul

REM Start frontend
echo.
echo === FRONTEND ===

if not exist node_modules (
    echo Installing dependencies...
    call npm install
)

echo Starting development server...
call npm run dev
