@echo off
echo Building static version of EbookAura...

REM Ensure we're in the right directory
cd /d "%~dp0"

REM First, run our direct static book creator script
echo Step 1: Creating static book IDs file...
call create-static-books.bat

if %ERRORLEVEL% neq 0 (
    echo Error: Failed to create static book IDs file
    echo Trying to continue with build anyway...
    REM Create a basic STATIC_BOOKS.js file with just the critical IDs
    echo Creating fallback STATIC_BOOKS.js with critical IDs only...
    if not exist src\app\utils mkdir src\app\utils
    echo /** > src\app\utils\STATIC_BOOKS.js
    echo  * Fallback static books file with critical IDs only >> src\app\utils\STATIC_BOOKS.js
    echo  * Generated on: %DATE% %TIME% >> src\app\utils\STATIC_BOOKS.js
    echo  */ >> src\app\utils\STATIC_BOOKS.js
    echo. >> src\app\utils\STATIC_BOOKS.js
    echo const STATIC_BOOKS = [ >> src\app\utils\STATIC_BOOKS.js
    echo   '681859bd560ce1fd792c2745',  // Critical problematic ID >> src\app\utils\STATIC_BOOKS.js
    echo   '6807c9d24fb1873f72080fb1',  // Another critical ID >> src\app\utils\STATIC_BOOKS.js
    echo   '6807be6cf05cdd8f4bdf933c',  // Critical book ID >> src\app\utils\STATIC_BOOKS.js
    echo   '6803d0c8cd7950184b1e8cf3',  // Critical book ID >> src\app\utils\STATIC_BOOKS.js
    echo ]; >> src\app\utils\STATIC_BOOKS.js
    echo. >> src\app\utils\STATIC_BOOKS.js
    echo export default STATIC_BOOKS; >> src\app\utils\STATIC_BOOKS.js
    echo Created fallback STATIC_BOOKS.js file
)

REM Set environment variables for static build
echo Step 2: Setting up environment variables...
set STATIC_EXPORT=true
set NODE_ENV=production

REM Check if .env.local exists and create it if not
if not exist .env.local (
    echo Creating .env.local with required variables...
    echo NEXT_PUBLIC_API_URL=https://ebookaura.onrender.com/api > .env.local
    echo STATIC_EXPORT=true >> .env.local
)

REM Clean output directories
echo Step 3: Cleaning previous build...
if exist .next (
    echo Cleaning .next directory...
    rmdir /s /q .next
)

if exist out (
    echo Cleaning out directory...
    rmdir /s /q out
)

REM Run the build
echo Step 4: Building static site...
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