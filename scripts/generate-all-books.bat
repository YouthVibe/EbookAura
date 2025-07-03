@echo off
echo Generating complete static book IDs list for Next.js static export...

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js is not installed or not in the PATH
    echo Please install Node.js and try again
    exit /b 1
)

echo Installing required dependencies...
cd /d "%~dp0"

REM Install dependencies with --force flag
call npm install mongoose dotenv --no-save --force --no-audit

REM Verify installations
node -e "try { require('mongoose'); require('dotenv'); console.log('Dependencies installed successfully'); } catch(e) { console.log('Error:', e.message); process.exit(1); }"
if %ERRORLEVEL% neq 0 (
    echo Error: Failed to verify dependencies
    exit /b 1
)

echo All dependencies installed successfully!

REM Run the script
echo Connecting to local MongoDB and generating book IDs list...
node scripts/generate-static-books-local.js

if %ERRORLEVEL% neq 0 (
    echo Error: Failed to generate static book IDs
    exit /b 1
)

echo.
echo Static book IDs list generated successfully!
echo.
echo Next steps:
echo 1. Run 'build-static.bat' to build the static site with all book pages
echo 2. Or run 'build-static-windows.bat' for a more detailed build process
echo.

pause
