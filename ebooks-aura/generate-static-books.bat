@echo off
echo Generating static book IDs list for Next.js static export...

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js is not installed or not in the PATH
    echo Please install Node.js and try again
    exit /b 1
)

REM Run the script
node scripts/generate-static-books.js

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