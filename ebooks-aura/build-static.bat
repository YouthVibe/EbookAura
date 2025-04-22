@echo off
echo 🚀 Building EbookAura static site...

:: Remove old build files
echo 🧹 Cleaning up old build files...
if exist .next rmdir /s /q .next
if exist out rmdir /s /q out

:: Install dependencies if needed
if not exist node_modules (
    echo 📦 Installing dependencies...
    call npm install
)

:: Install required build dependencies
echo 📦 Installing build dependencies...
call npm install cross-env rimraf --save-dev

:: Generate static book IDs
echo 📋 Generating static book IDs list...
node scripts/generate-static-books.js
if %errorlevel% neq 0 (
    echo ❌ Failed to generate static book IDs list!
    echo Please check the error messages above.
    exit /b 1
)

:: Verify static parameters include all critical book IDs
echo 🔍 Verifying static parameters...
node scripts/verify-static-params.js
if %errorlevel% neq 0 (
    echo ❌ Verification failed! Some critical book IDs are missing.
    echo Please check the error messages above.
    exit /b 1
)

:: Build the static site
echo 🔨 Building static site...
set NEXT_PUBLIC_API_URL=https://ebookaura.onrender.com/api
set STATIC_EXPORT=true
call npm run clean
call next build

:: Verify output directory contains book pages
echo 🔍 Verifying build output...
if exist out\books\6807c9d24fb1873f72080fb1 (
    echo ✅ Critical book page found in output!
) else (
    echo ⚠️ Warning: Critical book page not found in output.
    echo The build may have completed but is missing expected pages.
)

:: Success message
echo ✅ Static site built successfully!
echo 📂 The static site files are in the 'out' directory
echo.
echo 🌐 To test the site locally, run: npm run serve
echo 🚀 To deploy, upload the contents of the 'out' directory to your hosting provider

pause 