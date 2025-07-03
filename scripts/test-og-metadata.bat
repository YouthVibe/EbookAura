@echo off
SETLOCAL

REM Test Open Graph Metadata Implementation
REM This script runs the test-og-metadata.js script to verify if Open Graph tags are correctly implemented

echo ===================================
echo Open Graph Metadata Test
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
)

REM Check if a book ID was provided
IF "%1"=="" (
  echo ERROR: Please provide a book ID as an argument.
  echo Usage: test-og-metadata.bat BOOK_ID
  exit /b 1
)

REM Set the NEXT_PUBLIC_APP_URL environment variable if it's not already set
IF "%NEXT_PUBLIC_APP_URL%"=="" (
  echo NOTE: NEXT_PUBLIC_APP_URL environment variable is not set.
  echo Using default: http://localhost:3000
  SET "NEXT_PUBLIC_APP_URL=http://localhost:3000"
)

echo Testing Open Graph metadata for book ID: %1
echo Target URL: %NEXT_PUBLIC_APP_URL%/books/%1
echo.

REM Run the test script
node scripts/test-og-metadata.js %1

echo.
echo Test completed. Results saved to scripts/og-metadata-test-results.json
echo.

ENDLOCAL 