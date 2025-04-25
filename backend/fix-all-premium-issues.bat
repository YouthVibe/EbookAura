@echo off
echo === Fix All Premium Book Issues ===
echo.
echo This script will ensure all books have correct premium status.
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo Node.js is not installed. Please install Node.js to run this script.
  exit /b 1
)

REM Run the premium books fix first
echo Step 1: Running general premium book fix...
echo.
node fix-premium-production.js

if %ERRORLEVEL% NEQ 0 (
  echo An error occurred while fixing premium books.
  pause
  exit /b 1
)

echo.
echo Step 2: Running purchase records premium fix...
echo.
node fix-purchase-premium-books.js

if %ERRORLEVEL% NEQ 0 (
  echo An error occurred while fixing purchased books.
  pause
  exit /b 1
)

echo.
echo All premium book fixes completed successfully!
echo.
pause 