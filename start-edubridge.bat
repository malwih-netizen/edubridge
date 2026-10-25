@echo off
chcp 65001 >nul
title EduBridge
echo ==============================================
echo   EduBridge - starting API and website
echo   (MySQL from XAMPP must be running)
echo ==============================================

rem API: PHP + MySQL  ->  http://localhost:8000  (Swagger: /docs)
start "EduBridge API" cmd /k "cd /d %~dp0edubridge-api && php -S localhost:8000 -t public public/index.php"

rem Website: React  ->  http://localhost:5173
start "EduBridge Site" cmd /k "cd /d %~dp0edubridge-react && npm.cmd run dev"

timeout /t 4 >nul
start "" http://localhost:5173
start "" http://localhost:8000/docs

echo.
echo Website : http://localhost:5173
echo Swagger : http://localhost:8000/docs
echo Close the two server windows to stop.
