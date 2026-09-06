@echo off
setlocal
cd /d "%~dp0"
set PORT=3000
set NEXT_PUBLIC_API_URL=http://localhost:4000/api
call npx next dev > "%~dp0.next-dev.log" 2>&1
