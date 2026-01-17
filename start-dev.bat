@echo off
setlocal

cd /d %~dp0

docker compose up -d

call npm install
call npm --prefix server install
call npm --prefix client install

call npm run dev
