@echo off
cd /d "%~dp0"
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
 start "" http://localhost:4173
 node scripts/serve.mjs
 exit /b
)
where py >nul 2>nul
if %ERRORLEVEL% EQU 0 (
 start "" http://localhost:4173
 py -3 -m http.server 4173 --bind 127.0.0.1
 exit /b
)
echo Necesitas Node.js 20 o superior, o Python 3 para abrir el juego localmente.
echo Tambien puedes abrir la version web e instalarla desde tu navegador.
pause
