@echo off
setlocal
cd /d "%~dp0"
if exist run.log del run.log
start "mesi-pg" /min cmd /c node run.mjs > run.log 2>&1
echo started
