@echo off
REM EbookAura Backend Server Starter
echo.
echo ===================================
echo    EbookAura Backend Server
echo ===================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo ERROR: Node.js is not installed or not in your PATH.
  echo Please install Node.js from https://nodejs.org/
  echo.
  pause
  exit /b 1
)

REM Check if required files exist
if not exist server.js (
  echo ERROR: server.js not found in the current directory.
  echo Please run this batch file from the backend directory.
  echo.
  pause
  exit /b 1
)

if not exist start-server.js (
  echo ERROR: start-server.js not found in the current directory.
  echo.
  pause
  exit /b 1
)

REM Run the server starter script
echo Starting the EbookAura backend server...
echo.
node start-server.js

REM If the script exits with an error, keep the window open
if %ERRORLEVEL% neq 0 (
  echo.
  echo Server exited with an error. See above for details.
  pause
)

exit /b %ERRORLEVEL% 