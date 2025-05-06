@echo off
echo Checking static book files...

REM Ensure we're in the right directory
cd /d "%~dp0"

REM Define file paths to check
set STATIC_BOOKS_FILE=src\app\utils\STATIC_BOOKS.js
set FALLBACK_PATH_1=src\utils\STATIC_BOOKS.js
set FALLBACK_PATH_2=utils\STATIC_BOOKS.js

REM Check if the static books file exists
if exist %STATIC_BOOKS_FILE% (
    echo Found STATIC_BOOKS.js at %STATIC_BOOKS_FILE%
    set FOUND_FILE=%STATIC_BOOKS_FILE%
) else if exist %FALLBACK_PATH_1% (
    echo Found STATIC_BOOKS.js at %FALLBACK_PATH_1%
    set FOUND_FILE=%FALLBACK_PATH_1%
) else if exist %FALLBACK_PATH_2% (
    echo Found STATIC_BOOKS.js at %FALLBACK_PATH_2%
    set FOUND_FILE=%FALLBACK_PATH_2%
) else (
    echo Error: STATIC_BOOKS.js file not found
    echo Please run 'create-static-books.bat' to create the file
    exit /b 1
)

REM Define the critical book IDs to check for
set CRITICAL_ID_1=681859bd560ce1fd792c2745
set CRITICAL_ID_2=6807c9d24fb1873f72080fb1
set CRITICAL_ID_3=6807be6cf05cdd8f4bdf933c
set CRITICAL_ID_4=6803d0c8cd7950184b1e8cf3

REM Create a temporary find script
echo console.log('Checking STATIC_BOOKS.js for critical IDs...'); > check-static-books.js
echo const fs = require('fs'); >> check-static-books.js
echo const filePath = '%FOUND_FILE%'.replace(/\\/g, '/'); >> check-static-books.js
echo const content = fs.readFileSync(filePath, 'utf8'); >> check-static-books.js
echo. >> check-static-books.js
echo const criticalIds = [ >> check-static-books.js
echo   '%CRITICAL_ID_1%', // Problematic ID >> check-static-books.js
echo   '%CRITICAL_ID_2%', >> check-static-books.js
echo   '%CRITICAL_ID_3%', >> check-static-books.js
echo   '%CRITICAL_ID_4%' >> check-static-books.js
echo ]; >> check-static-books.js
echo. >> check-static-books.js
echo let allFound = true; >> check-static-books.js
echo criticalIds.forEach(id => { >> check-static-books.js
echo   if (content.includes(id)) { >> check-static-books.js
echo     console.log(`✓ Found critical ID: ${id}`); >> check-static-books.js
echo   } else { >> check-static-books.js
echo     console.error(`✗ Missing critical ID: ${id}`); >> check-static-books.js
echo     allFound = false; >> check-static-books.js
echo   } >> check-static-books.js
echo }); >> check-static-books.js
echo. >> check-static-books.js
echo if (allFound) { >> check-static-books.js
echo   console.log('✅ All critical IDs found in STATIC_BOOKS.js'); >> check-static-books.js
echo   process.exit(0); >> check-static-books.js
echo } else { >> check-static-books.js
echo   console.error('❌ Some critical IDs are missing from STATIC_BOOKS.js'); >> check-static-books.js
echo   process.exit(1); >> check-static-books.js
echo } >> check-static-books.js

REM Run the check script
node check-static-books.js
set CHECK_RESULT=%ERRORLEVEL%

REM Clean up the temp file
del check-static-books.js

REM Check the result
if %CHECK_RESULT% neq 0 (
    echo.
    echo Error: Not all critical book IDs are in the STATIC_BOOKS.js file
    echo Please run 'create-static-books.bat' to recreate the file
    exit /b 1
)

echo.
echo All critical book IDs are properly set up in STATIC_BOOKS.js
echo.
echo Ready to build! You can now run:
echo 1. build-static.bat - to build the static site
echo.

pause 