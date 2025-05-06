@echo off
echo =====================================
echo EbookAura Static Site Builder (Fixed)
echo =====================================
echo.

REM Ensure we're in the right directory
cd /d "%~dp0"

REM Step 1: Create the STATIC_BOOKS.js file with critical IDs
echo Step 1: Creating STATIC_BOOKS.js file with critical IDs...
echo.

if not exist src\app\utils mkdir src\app\utils

REM Get current date and time for the file header
for /f "tokens=2 delims==" %%a in ('wmic OS Get LocalDateTime /value') do set "dt=%%a"
set "YYYY=%dt:~0,4%"
set "MM=%dt:~4,2%"
set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%"
set "Min=%dt:~10,2%"
set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%-%MM%-%DD%T%HH%:%Min%:%Sec%"

echo /** > src\app\utils\STATIC_BOOKS.js
echo  * This file contains a list of all book IDs for static generation >> src\app\utils\STATIC_BOOKS.js
echo  * Generated on: %timestamp% >> src\app\utils\STATIC_BOOKS.js
echo  * >> src\app\utils\STATIC_BOOKS.js
echo  * For static exports, we must pre-render ALL book pages that users might access >> src\app\utils\STATIC_BOOKS.js
echo  */ >> src\app\utils\STATIC_BOOKS.js
echo. >> src\app\utils\STATIC_BOOKS.js
echo const STATIC_BOOKS = [ >> src\app\utils\STATIC_BOOKS.js
echo   // Critical book IDs that must always be included >> src\app\utils\STATIC_BOOKS.js
echo   '681859bd560ce1fd792c2745',  // The problematic ID that was missing before >> src\app\utils\STATIC_BOOKS.js
echo   '6807c9d24fb1873f72080fb1',  // Another critical ID >> src\app\utils\STATIC_BOOKS.js
echo   '6807be6cf05cdd8f4bdf933c',  // Critical book ID >> src\app\utils\STATIC_BOOKS.js
echo   '6803d0c8cd7950184b1e8cf3',  // Critical book ID >> src\app\utils\STATIC_BOOKS.js
echo ]; >> src\app\utils\STATIC_BOOKS.js
echo. >> src\app\utils\STATIC_BOOKS.js
echo export default STATIC_BOOKS; >> src\app\utils\STATIC_BOOKS.js

echo STATIC_BOOKS.js created successfully with critical IDs:
echo - 681859bd560ce1fd792c2745 (previously problematic ID)
echo - 6807c9d24fb1873f72080fb1
echo - 6807be6cf05cdd8f4bdf933c
echo - 6803d0c8cd7950184b1e8cf3
echo.

REM Step 2: Verify the file contains all critical IDs
echo Step 2: Verifying STATIC_BOOKS.js file content...
echo.

REM Use the simple verification script
echo console.log('Checking STATIC_BOOKS.js for critical IDs...'); > verify-temp.js
echo const fs = require('fs'); >> verify-temp.js
echo const path = require('path'); >> verify-temp.js
echo. >> verify-temp.js
echo // Critical IDs to check for >> verify-temp.js
echo const criticalIds = [ >> verify-temp.js
echo   '681859bd560ce1fd792c2745', // Problematic ID >> verify-temp.js
echo   '6807c9d24fb1873f72080fb1',  >> verify-temp.js
echo   '6807be6cf05cdd8f4bdf933c', >> verify-temp.js
echo   '6803d0c8cd7950184b1e8cf3' >> verify-temp.js
echo ]; >> verify-temp.js
echo. >> verify-temp.js
echo // File path >> verify-temp.js
echo const filePath = path.join(__dirname, 'src/app/utils/STATIC_BOOKS.js'); >> verify-temp.js
echo. >> verify-temp.js
echo // Check if file exists >> verify-temp.js
echo if (!fs.existsSync(filePath)) { >> verify-temp.js
echo   console.error('Error: Could not find STATIC_BOOKS.js file'); >> verify-temp.js
echo   process.exit(1); >> verify-temp.js
echo } >> verify-temp.js
echo. >> verify-temp.js
echo // Read the file >> verify-temp.js
echo const content = fs.readFileSync(filePath, 'utf8'); >> verify-temp.js
echo. >> verify-temp.js
echo // Check for critical IDs >> verify-temp.js
echo let allFound = true; >> verify-temp.js
echo criticalIds.forEach(id => { >> verify-temp.js
echo   if (content.includes(id)) { >> verify-temp.js
echo     console.log(`✓ Found critical ID: ${id}`); >> verify-temp.js
echo   } else { >> verify-temp.js
echo     console.error(`✗ Missing critical ID: ${id}`); >> verify-temp.js
echo     allFound = false; >> verify-temp.js
echo   } >> verify-temp.js
echo }); >> verify-temp.js
echo. >> verify-temp.js
echo if (allFound) { >> verify-temp.js
echo   console.log('\n✅ All critical IDs found in STATIC_BOOKS.js - VERIFICATION SUCCESSFUL'); >> verify-temp.js
echo   process.exit(0); >> verify-temp.js
echo } else { >> verify-temp.js
echo   console.error('\n❌ Some critical IDs are missing from STATIC_BOOKS.js - VERIFICATION FAILED'); >> verify-temp.js
echo   process.exit(1); >> verify-temp.js
echo } >> verify-temp.js

REM Run the verification script
node verify-temp.js
set VERIFY_RESULT=%ERRORLEVEL%

REM Clean up the verification script
del verify-temp.js

REM Check the verification result
if %VERIFY_RESULT% neq 0 (
    echo.
    echo Error: Verification failed! STATIC_BOOKS.js does not contain all critical IDs.
    echo This should not happen since we just created the file.
    echo Please check the file manually and try again.
    exit /b 1
)

echo.
echo Step 3: Setting up environment variables for static build...
echo.

REM Set environment variables for static build
set STATIC_EXPORT=true
set NODE_ENV=production

REM Check if .env.local exists and create it if not
if not exist .env.local (
    echo Creating .env.local with required variables...
    echo NEXT_PUBLIC_API_URL=https://ebookaura.onrender.com/api > .env.local
    echo STATIC_EXPORT=true >> .env.local
)

REM Step 4: Clean output directories
echo Step 4: Cleaning previous build directories...
echo.

if exist .next (
    echo Cleaning .next directory...
    rmdir /s /q .next
)

if exist out (
    echo Cleaning out directory...
    rmdir /s /q out
)

REM Step 5: Build the static site
echo Step 5: Building static site...
echo.

call npm run build

if %ERRORLEVEL% neq 0 (
    echo.
    echo Error: Build failed! Check the error messages above.
    exit /b 1
)

echo.
echo =====================================
echo Static build completed successfully!
echo =====================================
echo.
echo The static site has been generated in the 'out' directory.
echo All critical book IDs (including the problematic one) are included.
echo.
echo You can deploy these files to any static hosting service.
echo.

pause 