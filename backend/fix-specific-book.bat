@echo off
echo === Fix Premium Book Issues for Specific Book ===
echo.
echo This script will ensure a specific book has correct premium status.
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo Node.js is not installed. Please install Node.js to run this script.
  exit /b 1
)

REM Run the fix script
echo Running fix script...
node scripts/fix-specific-book.js %*

if %ERRORLEVEL% EQU 0 (
  echo.
  echo Book fixed successfully!
) else (
  echo.
  echo An error occurred while fixing the book.
)

pause 