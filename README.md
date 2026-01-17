# SQL Trainer Ground

Minimalistische lokale SQL-Trainings-App gegen eine MySQL-Instanz in Docker.

## Voraussetzungen
- Docker Desktop
- Node.js (LTS empfohlen)

## Start (Windows)
1) MySQL starten:
   - `docker compose up -d`
2) Environment setzen:
   - `copy server\.env.example server\.env`
3) Abhaengigkeiten installieren:
   - `npm run install:all`
4) Dev-Server starten:
   - `npm run dev`
5) Browser oeffnen:
   - http://localhost:5173

Optional: `start-dev.bat` startet Docker und die Dev-Server.

## Verbindung testen
Im DQL-Panel:
- `SELECT 1;`

## Projektstruktur
- `server` Express + mysql2 API
- `client` Vite + React + Monaco Editor

## API
- POST `http://localhost:3001/api/execute`
  - Body: `{ "panel": "DDL|DQL|DML|DCL", "sql": "...", "database": "bank" }`
- GET `http://localhost:3001/api/schema?database=bank`

## Hinweise
- Passwoerter liegen nur in `server/.env` (nicht im Frontend).
- Nach DDL-Statements wird das Schema automatisch aktualisiert.
- DQL ist standardmaessig read-only (nur SELECT/SHOW/DESCRIBE/EXPLAIN).
