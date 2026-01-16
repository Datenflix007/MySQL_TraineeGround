@echo off
cd /d "%~dp0"
echo ACHTUNG: Das loescht die Datenbankdaten (Volume)!
pause
docker compose down -v
echo.
echo Zurueckgesetzt. Starte neu mit start.bat
echo.
pause
