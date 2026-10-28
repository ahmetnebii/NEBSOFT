@echo off
chcp 65001 >nul
title NEBSOFT Pazar
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js bulunamadi. https://nodejs.org adresinden kurup tekrar deneyin.
  echo Alternatif: index.html dosyasini dogrudan tarayicida acabilirsiniz.
  pause
  exit /b 1
)
start "" http://localhost:5050
node server.js
