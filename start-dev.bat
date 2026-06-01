@echo off
echo Starting server and ngrok...
start cmd /k "node server.js"
timeout /t 2
start cmd /k "ngrok http 3100"
echo.
echo After ngrok starts, copy the URL and update:
echo  1. APP_URL in .env
echo  2. API_BASE in your frontend HTML
pause