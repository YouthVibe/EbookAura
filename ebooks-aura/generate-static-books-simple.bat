@echo off
echo Generating static book IDs list for Next.js static export (simplified version)...

REM Ensure we're in the right directory
cd /d "%~dp0"

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js is not installed or not in the PATH
    echo Please install Node.js and try again
    exit /b 1
)

REM Run the simplified script directly - no dependencies needed
echo Running simplified static book ID generator...
node scripts/generate-static-books-simple.js

if %ERRORLEVEL% neq 0 (
    echo Error: Failed to generate static book IDs
    exit /b 1
)

echo.
echo Static book IDs list generated successfully!
echo.
echo Next steps:
echo 1. Run 'verify-book-params.bat' to verify the IDs were added correctly
echo 2. Run 'build-static.bat' to build the static site with all book pages
echo.

pause 