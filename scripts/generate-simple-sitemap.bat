@echo off
SETLOCAL

REM Simple Sitemap Generator
REM This script generates a basic sitemap.xml file without external dependencies

echo ===================================
echo EbookAura Simple Sitemap Generator
echo ===================================

REM Check if node is installed
WHERE node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
  echo Node.js is not installed or not in PATH. Please install Node.js.
  exit /b 1
)

REM Set the environment variables if they're not already set
IF "%NEXT_PUBLIC_APP_URL%"=="" (
  echo NOTE: NEXT_PUBLIC_APP_URL environment variable is not set.
  echo Using default: https://ebookaura.onrender.com
  SET "NEXT_PUBLIC_APP_URL=https://ebookaura.onrender.com"
)

echo Generating simple sitemap for %NEXT_PUBLIC_APP_URL%
echo.

REM Run the generator script (this script has NO external dependencies)
node scripts/generate-simple-sitemap.js
IF %ERRORLEVEL% NEQ 0 (
  echo The script encountered an error. See above for details.
  exit /b 1
)

echo.
echo Simple sitemap generated successfully in public/sitemap.xml
echo.

ENDLOCAL 