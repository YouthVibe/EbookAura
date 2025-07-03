@echo off
echo Building static version of EbookAura with pre-fetched data...

REM Ensure we're in the right directory
cd /d "%~dp0"

REM Process pre-fetched book data
echo Step 1: Processing pre-fetched book data...
node scripts/process-book-data.js

if %ERRORLEVEL% neq 0 (
    echo Error: Failed to process book data
    exit /b 1
)

REM Set environment variables for static build
echo Step 3: Setting up environment variables...
set STATIC_EXPORT=true
set NODE_ENV=production

REM Check if .env.local exists and create it if not
if not exist .env.local (
    echo Creating .env.local with required variables...
    echo NEXT_PUBLIC_API_URL=https://ebookaura.onrender.com/api > .env.local
    echo STATIC_EXPORT=true >> .env.local
    echo USE_STATIC_DATA=true >> .env.local
)

REM Clean output directories
echo Step 4: Cleaning previous build...
if exist .next (
    echo Cleaning .next directory...
    rmdir /s /q .next
)

if exist out (
    echo Cleaning out directory...
    rmdir /s /q out
)

REM Run the build
echo Step 5: Building static site...
call npm run build

if %ERRORLEVEL% neq 0 (
    echo Error: Build failed
    exit /b 1
)

echo.
echo Static build completed successfully!
echo.
echo The static site has been generated in the 'out' directory.
echo You can deploy these files to any static hosting service.
echo.

pause
