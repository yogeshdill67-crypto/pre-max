@echo off
echo Starting PreMax...

:: Start Server
start "PreMax Server" cmd /k "cd /d \"%~dp0server\" && npm install && npm run dev"

:: Start Client
start "PreMax Client" cmd /k "cd /d \"%~dp0client\" && npm run dev"

echo Application starting...
echo Server will be at http://localhost:3000
echo Client will be at http://localhost:5173
pause
