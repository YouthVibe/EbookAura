@echo off
echo Testing static books generation and verification...

REM Run the generate-static-books script
call generate-static-books.bat

REM Check if the script ran successfully
if %ERRORLEVEL% neq 0 (
    echo Error: Failed to generate static books list
    exit /b 1
)

REM Create a verification script
echo console.log('Verifying STATIC_BOOKS.js file...'); > verify-static-books.js
echo const fs = require('fs'); >> verify-static-books.js
echo const path = require('path'); >> verify-static-books.js
echo. >> verify-static-books.js
echo // Paths to check for the STATIC_BOOKS.js file >> verify-static-books.js
echo const paths = [ >> verify-static-books.js
echo   path.join(__dirname, 'src/app/utils/STATIC_BOOKS.js'), >> verify-static-books.js
echo   path.join(__dirname, 'src/utils/STATIC_BOOKS.js'), >> verify-static-books.js
echo   path.join(__dirname, 'utils/STATIC_BOOKS.js') >> verify-static-books.js
echo ]; >> verify-static-books.js
echo. >> verify-static-books.js
echo // Critical IDs to check for >> verify-static-books.js
echo const criticalIds = [ >> verify-static-books.js
echo   '681859bd560ce1fd792c2745', // Problematic ID >> verify-static-books.js
echo   '6807c9d24fb1873f72080fb1', // Another critical ID >> verify-static-books.js
echo ]; >> verify-static-books.js
echo. >> verify-static-books.js
echo // Find the STATIC_BOOKS.js file >> verify-static-books.js
echo let staticBooksPath = null; >> verify-static-books.js
echo for (const p of paths) { >> verify-static-books.js
echo   if (fs.existsSync(p)) { >> verify-static-books.js
echo     staticBooksPath = p; >> verify-static-books.js
echo     break; >> verify-static-books.js
echo   } >> verify-static-books.js
echo } >> verify-static-books.js
echo. >> verify-static-books.js
echo if (!staticBooksPath) { >> verify-static-books.js
echo   console.error('Error: Could not find STATIC_BOOKS.js file'); >> verify-static-books.js
echo   process.exit(1); >> verify-static-books.js
echo } >> verify-static-books.js
echo. >> verify-static-books.js
echo console.log(`Found STATIC_BOOKS.js at: ${staticBooksPath}`); >> verify-static-books.js
echo. >> verify-static-books.js
echo // Read the file content >> verify-static-books.js
echo const content = fs.readFileSync(staticBooksPath, 'utf8'); >> verify-static-books.js
echo. >> verify-static-books.js
echo // Check for each critical ID >> verify-static-books.js
echo let allFound = true; >> verify-static-books.js
echo for (const id of criticalIds) { >> verify-static-books.js
echo   if (content.includes(id)) { >> verify-static-books.js
echo     console.log(`✓ Found critical ID: ${id}`); >> verify-static-books.js
echo   } else { >> verify-static-books.js
echo     console.error(`✗ Missing critical ID: ${id}`); >> verify-static-books.js
echo     allFound = false; >> verify-static-books.js
echo   } >> verify-static-books.js
echo } >> verify-static-books.js
echo. >> verify-static-books.js
echo // Count total IDs >> verify-static-books.js
echo const idMatches = content.match(/'[a-f0-9]{24}'/g) || []; >> verify-static-books.js
echo console.log(`Total book IDs found: ${idMatches.length}`); >> verify-static-books.js
echo. >> verify-static-books.js
echo if (allFound) { >> verify-static-books.js
echo   console.log('Verification successful! All critical IDs are included.'); >> verify-static-books.js
echo   process.exit(0); >> verify-static-books.js
echo } else { >> verify-static-books.js
echo   console.error('Verification failed! Some critical IDs are missing.'); >> verify-static-books.js
echo   process.exit(1); >> verify-static-books.js
echo } >> verify-static-books.js

REM Run the verification script
node verify-static-books.js

REM Check if verification was successful
if %ERRORLEVEL% neq 0 (
    echo Error: Static books verification failed
    exit /b 1
)

echo.
echo All tests passed! The problematic ID is now included in the static generation.
echo.
echo Next steps:
echo 1. Run 'npm run build' or 'build-static.bat' to build the static site
echo 2. The problematic book ID should now be properly generated

REM Clean up the verification script
del verify-static-books.js

pause 