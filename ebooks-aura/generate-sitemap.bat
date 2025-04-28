@echo off
SETLOCAL

REM Sitemap Generator Script
REM This script generates a sitemap.xml file for the EbookAura website

echo ===================================
echo EbookAura Sitemap Generator
echo ===================================

REM Check if node is installed
WHERE node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
  echo Node.js is not installed or not in PATH. Please install Node.js.
  exit /b 1
)

REM Install required dependencies if they don't exist
echo Checking dependencies...
call npm list node-fetch date-fns >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
  echo Installing required dependencies...
  call npm install --no-save node-fetch@2 date-fns
)

REM Set the environment variables if they're not already set
IF "%NEXT_PUBLIC_APP_URL%"=="" (
  echo NOTE: NEXT_PUBLIC_APP_URL environment variable is not set.
  echo Using default: https://ebookaura.onrender.com
  SET "NEXT_PUBLIC_APP_URL=https://ebookaura.onrender.com"
)

IF "%NEXT_PUBLIC_API_URL%"=="" (
  echo NOTE: NEXT_PUBLIC_API_URL environment variable is not set.
  echo Using default: https://ebookaura.onrender.com/api
  SET "NEXT_PUBLIC_API_URL=https://ebookaura.onrender.com/api"
)

echo Generating sitemap for %NEXT_PUBLIC_APP_URL%
echo.

REM Run the generator script
node scripts/generate-sitemap.js

echo.
echo Sitemap generation completed. Check public/sitemap.xml
echo.

ENDLOCAL 