@echo off
echo Generating static book IDs list for Next.js static export using local JSON data...

REM Verify that books.json exists
if not exist "%~dp0books.json" (
    echo Error: books.json not found in the project root
    exit /b 1
)

REM Process the book data
echo Processing book data from local JSON file...
node scripts/process-book-data.js

if %ERRORLEVEL% neq 0 (
    echo Error: Failed to process book data
    exit /b 1
)

echo.
echo Static book IDs list generated successfully!
echo.
echo Next steps:
echo 1. Run 'build-static-with-data.bat' to build the static site with all book pages
echo.

pause 