@echo off
SETLOCAL

REM PDF Metadata and Enhanced Sitemap Generator
REM This script generates metadata for all PDFs and an enhanced sitemap

echo ===================================
echo EbookAura PDF Metadata Generator
echo ===================================

REM Check if node is installed
WHERE node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
  echo Node.js is not installed or not in PATH. Please install Node.js.
  exit /b 1
)

REM Install required dependencies directly with legacy-peer-deps to bypass dependency conflicts
echo Installing required dependencies...
call npm install --no-save --legacy-peer-deps node-fetch@2 date-fns
IF %ERRORLEVEL% NEQ 0 (
  echo Failed to install dependencies with --legacy-peer-deps.
  echo Trying with --force...
  call npm install --no-save --force node-fetch@2 date-fns
  IF %ERRORLEVEL% NEQ 0 (
    echo Failed to install dependencies. Check your internet connection and npm configuration.
    exit /b 1
  )
)
echo Dependencies installed successfully.

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

echo Generating PDF metadata and enhanced sitemap for %NEXT_PUBLIC_APP_URL%
echo Fetching book data from %NEXT_PUBLIC_API_URL%
echo.

REM Create output directory if it doesn't exist
if not exist "%~dp0public\pdf-metadata" (
  echo Creating output directory...
  mkdir "%~dp0public\pdf-metadata"
)

REM Run the generator script
echo Running PDF metadata generator script...
node scripts/generate-pdf-metadata.js
IF %ERRORLEVEL% NEQ 0 (
  echo The script encountered an error. See above for details.
  exit /b 1
)

REM Generate meta.txt files for better PDF discoverability
echo.
echo Running meta.txt generator for PDF SEO...
node scripts/generate-pdf-meta-txt.js
IF %ERRORLEVEL% NEQ 0 (
  echo Warning: meta.txt generation encountered an error, but processing will continue.
)

echo.
echo PDF metadata generation completed successfully.
echo.
echo Results:
echo - Metadata HTML files: public/pdf-metadata/*.html
echo - Metadata JSON files: public/pdf-metadata/*.json
echo - Metadata TXT files: public/pdf-metadata/*.txt
echo - Enhanced sitemap: public/sitemap.xml
echo.
echo These files will greatly improve your PDF's visibility in search engines.
echo.

ENDLOCAL 