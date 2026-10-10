@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 goto no_node

node "%~dp0start-creatorsmp-server.js"
if errorlevel 1 (
    echo.
    echo De server kon niet worden gestart of is gestopt.
    pause
)
exit /b

:no_node
echo Node.js is niet geinstalleerd. Installeer Node.js vanaf https://nodejs.org/ en probeer opnieuw.
pause
