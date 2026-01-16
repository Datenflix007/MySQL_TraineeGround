@echo off
cd /d "%~dp0"
docker compose down
echo.
echo Container gestoppt.
echo.
pause
