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

REM Run the fix script
echo Running fix script...
node scripts/fix-all-premium-issues.js

if %ERRORLEVEL% EQU 0 (
  echo.
  echo Script completed successfully!
) else (
  echo.
  echo An error occurred while fixing premium books.
)

pause 