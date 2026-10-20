@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required. Install Node.js and try again.
  pause
  exit /b 1
)
if not exist node_modules\vite\bin\vite.js (
  echo First-time setup: run npm.cmd install in this folder.
  pause
  exit /b 1
)
echo Opening the app at http://localhost:5173
echo Keep this window open. Press Ctrl+C to stop the server.
call npm.cmd run dev
if errorlevel 1 (
  echo The server could not start. Read the error above.
  pause
  exit /b 1
)
