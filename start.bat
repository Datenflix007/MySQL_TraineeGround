@echo off
cd /d "%~dp0"
docker compose up -d
echo.
echo MySQL läuft.
echo Adminer: http://localhost:8080
echo phpMyAdmin: http://localhost:8081
echo.
pause
