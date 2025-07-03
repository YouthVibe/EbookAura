@echo off
echo ========================================
echo EbookAura Metadata Testing Tool
echo Tests metadata for both home and search pages
echo ========================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js is not installed. Please install Node.js to run this script.
    exit /b 1
)

REM Ensure dependencies are installed
echo Checking for required dependencies...
call npm list node-fetch >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Installing node-fetch...
    call npm install node-fetch@2 --no-save
    if %ERRORLEVEL% NEQ 0 (
        echo Error: Failed to install node-fetch. Trying with --force...
        call npm install node-fetch@2 --no-save --force
        if %ERRORLEVEL% NEQ 0 (
            echo Error: Failed to install dependencies. Please run 'npm install node-fetch@2 cheerio --save-dev' manually.
            exit /b 1
        )
    )
)

call npm list cheerio >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Installing cheerio...
    call npm install cheerio --no-save
    if %ERRORLEVEL% NEQ 0 (
        echo Error: Failed to install cheerio. Trying with --force...
        call npm install cheerio --no-save --force
        if %ERRORLEVEL% NEQ 0 (
            echo Error: Failed to install dependencies. Please run 'npm install cheerio --save-dev' manually.
            exit /b 1
        )
    )
)

REM Set the base URL if not already set
if "%NEXT_PUBLIC_APP_URL%"=="" (
    echo NEXT_PUBLIC_APP_URL not set. Using default: https://ebooks-aura.com
    set NEXT_PUBLIC_APP_URL=https://ebooks-aura.com
) else (
    echo Using NEXT_PUBLIC_APP_URL: %NEXT_PUBLIC_APP_URL%
)

echo Running metadata tests for home and search pages...
node scripts/test-search-metadata.js

if %ERRORLEVEL% NEQ 0 (
    echo Error: Metadata test failed. See console output for details.
    exit /b 1
)

echo ========================================
echo Metadata testing completed successfully!
echo Results saved to:
echo - scripts/home-metadata-test-results.json
echo - scripts/search-metadata-test-results.json
echo ========================================

exit /b 0 