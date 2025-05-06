@echo off
echo ===================================================
echo EbookAura Static Site Generator - Complete Solution
echo ===================================================
echo.

REM Ensure we're in the right directory
cd /d "%~dp0"

REM Create a critical IDs file directly in the required location
echo Step 1: Creating critical IDs file for static generation...
echo.

if not exist src\app\utils mkdir src\app\utils

REM Current timestamp for the file header
for /f "tokens=2 delims==" %%a in ('wmic OS Get LocalDateTime /value') do set "dt=%%a" 2>nul
if "%dt%"=="" (
    set "timestamp=%DATE% %TIME%"
) else (
    set "YYYY=%dt:~0,4%"
    set "MM=%dt:~4,2%"
    set "DD=%dt:~6,2%"
    set "HH=%dt:~8,2%"
    set "Min=%dt:~10,2%"
    set "Sec=%dt:~12,2%"
    set "timestamp=%YYYY%-%MM%-%DD%T%HH%:%Min%:%Sec%"
)

REM Create the STATIC_BOOKS.js file with all critical IDs
echo /** > src\app\utils\STATIC_BOOKS.js
echo  * Static book IDs for EbookAura static generation >> src\app\utils\STATIC_BOOKS.js
echo  * Generated on: %timestamp% >> src\app\utils\STATIC_BOOKS.js
echo  * >> src\app\utils\STATIC_BOOKS.js
echo  * These IDs must be included in the static site generation >> src\app\utils\STATIC_BOOKS.js
echo  */ >> src\app\utils\STATIC_BOOKS.js
echo. >> src\app\utils\STATIC_BOOKS.js
echo const STATIC_BOOKS = [ >> src\app\utils\STATIC_BOOKS.js
echo   // Critical book IDs - ALWAYS include these >> src\app\utils\STATIC_BOOKS.js
echo   '681859bd560ce1fd792c2745',  // Previously problematic ID - must be included >> src\app\utils\STATIC_BOOKS.js
echo   '6807c9d24fb1873f72080fb1',  // Critical book ID >> src\app\utils\STATIC_BOOKS.js
echo   '6807be6cf05cdd8f4bdf933c',  // Critical book ID >> src\app\utils\STATIC_BOOKS.js
echo   '6803d0c8cd7950184b1e8cf3',  // Critical book ID >> src\app\utils\STATIC_BOOKS.js
echo   '680735665ceba10744914991',  // Additional critical ID from logs >> src\app\utils\STATIC_BOOKS.js
echo ]; >> src\app\utils\STATIC_BOOKS.js
echo. >> src\app\utils\STATIC_BOOKS.js
echo export default STATIC_BOOKS; >> src\app\utils\STATIC_BOOKS.js

echo STATIC_BOOKS.js created successfully with the following critical IDs:
echo - 681859bd560ce1fd792c2745 (previously problematic ID)
echo - 6807c9d24fb1873f72080fb1
echo - 6807be6cf05cdd8f4bdf933c
echo - 6803d0c8cd7950184b1e8cf3
echo - 680735665ceba10744914991
echo.

REM Verify the file was created properly
echo Step 2: Verifying STATIC_BOOKS.js file...
echo.

if not exist src\app\utils\STATIC_BOOKS.js (
    echo Error: Failed to create STATIC_BOOKS.js file!
    echo Please check write permissions to the src\app\utils directory.
    exit /b 1
)

echo Verification successful. STATIC_BOOKS.js was created at src\app\utils\STATIC_BOOKS.js
echo.

REM Set up environment variables for static build
echo Step 3: Setting up environment variables for static export...
echo.

REM Create .env.local file with required variables
echo Creating/updating .env.local with required variables...
echo NEXT_PUBLIC_API_URL=https://ebookaura.onrender.com/api > .env.local
echo STATIC_EXPORT=true >> .env.local

echo Environment variables set up in .env.local
echo.

REM Clean output directories to ensure a fresh build
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

echo Build directories cleaned successfully
echo.

REM Extract modified book page component to fix any issues
echo Step 5: Patching book page component for static generation...
echo.

REM Check if the page.js file exists
if not exist src\app\books\[id]\page.js (
    echo Warning: Could not find book page component at src\app\books\[id]\page.js
    echo Skipping patch step. The build may still succeed.
) else (
    echo Found book page component. Creating backup and patching file...
    
    REM Create a backup of the original file
    copy src\app\books\[id]\page.js src\app\books\[id]\page.js.bak
    
    REM Create a simple patch script to modify the generateStaticParams function
    echo // Create a simple patch to ensure critical IDs are included > patch-book-page.js
    echo const fs = require('fs'); >> patch-book-page.js
    echo const path = require('path'); >> patch-book-page.js
    echo. >> patch-book-page.js
    echo const filePath = path.join(__dirname, 'src/app/books/[id]/page.js'); >> patch-book-page.js
    echo let content = fs.readFileSync(filePath, 'utf8'); >> patch-book-page.js
    echo. >> patch-book-page.js
    echo // Define critical IDs to ensure they're included >> patch-book-page.js
    echo const criticalIds = [ >> patch-book-page.js
    echo   '681859bd560ce1fd792c2745', // Problematic ID >> patch-book-page.js
    echo   '6807c9d24fb1873f72080fb1', >> patch-book-page.js
    echo   '6807be6cf05cdd8f4bdf933c', >> patch-book-page.js
    echo   '6803d0c8cd7950184b1e8cf3', >> patch-book-page.js
    echo   '680735665ceba10744914991' >> patch-book-page.js
    echo ]; >> patch-book-page.js
    echo. >> patch-book-page.js
    echo // Check if the file mentions the problematic ID >> patch-book-page.js
    echo console.log('Patching book page component for static generation...'); >> patch-book-page.js
    echo. >> patch-book-page.js
    echo // Ensure the file has a proper generateStaticParams function that includes critical IDs >> patch-book-page.js
    echo const hasGenerateStaticParams = content.includes('export async function generateStaticParams'); >> patch-book-page.js
    echo. >> patch-book-page.js
    echo if (hasGenerateStaticParams) { >> patch-book-page.js
    echo   console.log('Found generateStaticParams function. Ensuring critical IDs are included...'); >> patch-book-page.js
    echo. >> patch-book-page.js
    echo   // Add a fallback section at the end of the function to ensure critical IDs >> patch-book-page.js
    echo   // Look for the return statement pattern >> patch-book-page.js
    echo   const fallbackCode = `    // Always explicitly include critical IDs that must be generated\n    const bookIdMap = new Map();\n    \n    // Add all STATIC_BOOKS first\n    STATIC_BOOKS.forEach(id => {\n      bookIdMap.set(id, { id, source: 'static-books' });\n    });\n\n    // Explicitly add critical IDs\n    ['681859bd560ce1fd792c2745', '6807c9d24fb1873f72080fb1', '6807be6cf05cdd8f4bdf933c', '6803d0c8cd7950184b1e8cf3', '680735665ceba10744914991'].forEach(id => {\n      if (!bookIdMap.has(id)) {\n        bookIdMap.set(id, { id, source: 'critical-explicit' });\n        console.log(\`Added critical book ID: \${id}\`);\n      }\n    });\n\n    // Always include a catch-all "not-found" page\n    bookIdMap.set('not-found', { id: 'not-found', source: 'catch-all' });\n\n    // Convert map to array of params objects\n    const bookIds = Array.from(bookIdMap.values()).map(entry => ({ id: entry.id }));\n    \n    console.log(\`Generated static params for \${bookIds.length} book pages\`);\n    console.log(\`All book IDs: \${bookIds.map(b => b.id).join(', ')}\`);\n    \n    return bookIds;`; >> patch-book-page.js
    echo. >> patch-book-page.js
    echo   // Check if the function already has our fallback code >> patch-book-page.js
    echo   if (!content.includes('critical-explicit')) { >> patch-book-page.js
    echo     // Find where the generateStaticParams function is and insert our code >> patch-book-page.js
    echo     const funcStart = content.indexOf('export async function generateStaticParams'); >> patch-book-page.js
    echo     if (funcStart !== -1) { >> patch-book-page.js
    echo       // Find the function body >> patch-book-page.js
    echo       const openBrace = content.indexOf('{', funcStart); >> patch-book-page.js
    echo       if (openBrace !== -1) { >> patch-book-page.js
    echo         // Replace the entire function body with our version >> patch-book-page.js
    echo         let bracketCount = 1; >> patch-book-page.js
    echo         let closePos = openBrace + 1; >> patch-book-page.js
    echo         while (bracketCount > 0 && closePos < content.length) { >> patch-book-page.js
    echo           if (content[closePos] === '{') bracketCount++; >> patch-book-page.js
    echo           if (content[closePos] === '}') bracketCount--; >> patch-book-page.js
    echo           closePos++; >> patch-book-page.js
    echo         } >> patch-book-page.js
    echo. >> patch-book-page.js
    echo         // Replace the function body with our enhanced version >> patch-book-page.js
    echo         const functionHeader = content.substring(funcStart, openBrace + 1); >> patch-book-page.js
    echo         const beforeFunc = content.substring(0, funcStart); >> patch-book-page.js
    echo         const afterFunc = content.substring(closePos); >> patch-book-page.js
    echo. >> patch-book-page.js
    echo         // Create new content with patched function >> patch-book-page.js
    echo         console.log('Patching generateStaticParams function...'); >> patch-book-page.js
    echo         content = beforeFunc + functionHeader + '\n  try {\n' + fallbackCode + '\n  } catch (error) {\n    console.error("Error generating static book paths:", error);\n    return criticalIds.map(id => ({ id }));\n  }\n}' + afterFunc; >> patch-book-page.js
    echo. >> patch-book-page.js
    echo         // Write changes back to file >> patch-book-page.js
    echo         fs.writeFileSync(filePath, content, 'utf8'); >> patch-book-page.js
    echo         console.log('Successfully patched generateStaticParams function with critical IDs!'); >> patch-book-page.js
    echo       } >> patch-book-page.js
    echo     } >> patch-book-page.js
    echo   } else { >> patch-book-page.js
    echo     console.log('Function already contains critical IDs fallback code. No changes needed.'); >> patch-book-page.js
    echo   } >> patch-book-page.js
    echo } else { >> patch-book-page.js
    echo   console.log('Warning: Could not find generateStaticParams function in the file.'); >> patch-book-page.js
    echo   console.log('The file may be using a different pattern for static generation.'); >> patch-book-page.js
    echo } >> patch-book-page.js
    
    REM Run the patch script
    node patch-book-page.js
    
    REM Clean up patch script
    del patch-book-page.js
)

echo Book page component patching completed
echo.

REM Run the Next.js build process
echo Step 6: Building static site...
echo.

REM Set environment variables for the current session
set NODE_ENV=production
set STATIC_EXPORT=true

REM Run the build command
call npm run build

if %ERRORLEVEL% neq 0 (
    echo.
    echo Error: Build failed! Check the error messages above.
    exit /b 1
)

REM Verify the output directory
echo.
echo Step 7: Verifying static build output...
echo.

if not exist out\books\681859bd560ce1fd792c2745 (
    echo Warning: The problematic book ID directory was not created in the output.
    echo You may need to check the build logs for errors.
) else (
    echo ✓ Found problematic book ID directory in the output.
)

echo.
echo ===================================================
echo Static site generation completed successfully!
echo ===================================================
echo.
echo The static site has been generated in the 'out' directory.
echo All critical book IDs should be included in the build.
echo.
echo You can deploy these files to any static hosting service.
echo.

pause 