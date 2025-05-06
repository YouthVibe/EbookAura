@echo off
echo ===================================================
echo EbookAura Simple Static Site Generator Fix
echo ===================================================
echo.

REM Ensure we're in the right directory
cd /d "%~dp0"

REM Create the src/app/utils directory if it doesn't exist
if not exist src\app\utils mkdir src\app\utils

REM Create the STATIC_BOOKS.js file with critical IDs
echo Creating STATIC_BOOKS.js with critical book IDs...
echo /** > src\app\utils\STATIC_BOOKS.js
echo  * Static book IDs for EbookAura static generation >> src\app\utils\STATIC_BOOKS.js
echo  * Generated on: %DATE% %TIME% >> src\app\utils\STATIC_BOOKS.js
echo  */ >> src\app\utils\STATIC_BOOKS.js
echo. >> src\app\utils\STATIC_BOOKS.js
echo const STATIC_BOOKS = [ >> src\app\utils\STATIC_BOOKS.js
echo   // Critical book IDs that must be included in static generation >> src\app\utils\STATIC_BOOKS.js
echo   '681859bd560ce1fd792c2745',  // Previously problematic ID >> src\app\utils\STATIC_BOOKS.js
echo   '6807c9d24fb1873f72080fb1',  // Critical book ID >> src\app\utils\STATIC_BOOKS.js
echo   '6807be6cf05cdd8f4bdf933c',  // Critical book ID >> src\app\utils\STATIC_BOOKS.js
echo   '6803d0c8cd7950184b1e8cf3',  // Critical book ID >> src\app\utils\STATIC_BOOKS.js
echo   '680735665ceba10744914991',  // Additional critical ID from logs >> src\app\utils\STATIC_BOOKS.js
echo ]; >> src\app\utils\STATIC_BOOKS.js
echo. >> src\app\utils\STATIC_BOOKS.js
echo export default STATIC_BOOKS; >> src\app\utils\STATIC_BOOKS.js

echo.
echo STATIC_BOOKS.js created successfully.
echo.

REM Create/update .env.local with required variables
echo Creating .env.local with static export settings...
echo NEXT_PUBLIC_API_URL=https://ebookaura.onrender.com/api > .env.local
echo STATIC_EXPORT=true >> .env.local

echo.
echo Environment variables set up in .env.local
echo.

REM Clean previous build directories
echo Cleaning previous build directories...
if exist .next rmdir /s /q .next
if exist out rmdir /s /q out
echo.

REM Run the build with correct environment variables
echo Starting static build process...
echo This may take a few minutes.
echo.

REM Set environment variables for the build
set STATIC_EXPORT=true
set NODE_ENV=production

REM Run the build
call npm run build

echo.
echo Build process completed.
echo.

REM Verify the critical book ID directory was created
echo Checking for critical book ID directories...
if exist out\books\681859bd560ce1fd792c2745 (
    echo ✓ Critical book ID directory created successfully!
) else (
    echo ✗ Warning: Critical book ID directory was not created.
)

echo.
echo ===================================================
echo Static site generation completed!
echo The static site has been generated in the 'out' directory.
echo ===================================================
echo.

pause 