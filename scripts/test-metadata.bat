@echo off
SETLOCAL

REM Test Home and Search Page Metadata Implementation
REM This script runs the test-search-metadata.js script to verify metadata implementation
REM for both home page and search page

echo ===================================
echo Home and Search Page Metadata Test
echo ===================================

REM Check if node is installed
WHERE node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
  echo Node.js is not installed or not in PATH. Please install Node.js.
  exit /b 1
)

REM Install required dependencies if they don't exist
echo Checking dependencies...
call npm list node-fetch cheerio >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
  echo Installing required dependencies...
  call npm install --no-save node-fetch@2 cheerio
  IF %ERRORLEVEL% NEQ 0 (
    echo Failed to install dependencies. Trying with --legacy-peer-deps...
    call npm install --no-save --legacy-peer-deps node-fetch@2 cheerio
    IF %ERRORLEVEL% NEQ 0 (
      echo Failed to install dependencies. Please install them manually:
      echo npm install --no-save node-fetch@2 cheerio
      exit /b 1
    )
  )
)

REM Set the NEXT_PUBLIC_APP_URL environment variable if it's not already set
IF "%NEXT_PUBLIC_APP_URL%"=="" (
  echo NOTE: NEXT_PUBLIC_APP_URL environment variable is not set.
  echo Using default: http://localhost:3000
  SET "NEXT_PUBLIC_APP_URL=http://localhost:3000"
)

echo Testing home page and search page metadata
echo Target URLs: 
echo - %NEXT_PUBLIC_APP_URL% (Home)
echo - %NEXT_PUBLIC_APP_URL%/search (Search)
echo.

REM Run the test script
node scripts/test-search-metadata.js

echo.
echo Test completed. Results saved to:
echo - scripts/home-metadata-test-results.json
echo - scripts/search-metadata-test-results.json
echo.

ENDLOCAL 