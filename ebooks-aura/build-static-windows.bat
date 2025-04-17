@echo off
echo Building EbookAura static site...

:: Manually delete folders to avoid permission issues
echo Cleaning old build files...
if exist ".next" (
    rd /s /q ".next"
)
if exist "out" (
    rd /s /q "out"
)

:: Set environment variables
set NEXT_PUBLIC_API_URL=https://ebookaura.onrender.com/api
set STATIC_EXPORT=true

:: Run the build
echo Building static site...
call npx next build

:: Check if build was successful
if exist "out" (
    echo Static site successfully built!
    echo The site files are in the 'out' directory.
    echo.
    echo To test locally, run: npx serve out
) else (
    echo Build may have failed. Check for errors above.
)

pause 