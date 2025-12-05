@echo off
echo Starting Virtual Instructor Project...
echo.

echo Starting Backend Server (Port 3000)...
start "Backend Server" cmd /k "cd Backend && npm start"

echo Waiting 3 seconds...
timeout /t 3 /nobreak > nul

echo Starting Frontend Server (Port 8081)...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:3000
echo Frontend: http://localhost:8081
echo.
echo Press any key to exit...
pause > nul



