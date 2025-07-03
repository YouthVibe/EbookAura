@echo off
echo Running verification for book static parameters...

REM Ensure we're in the right directory
cd /d "%~dp0"

REM Run the verification script
node scripts/verify-book-params.js

REM Check if verification was successful
if %ERRORLEVEL% neq 0 (
    echo.
    echo Error: Verification failed! Please check the errors above.
    echo.
    echo Suggested fix: Run 'generate-static-books.bat' to update the book IDs list.
    echo.
    exit /b 1
) else (
    echo.
    echo Verification passed! All critical book IDs are included.
    echo.
    echo You can now run 'build-static.bat' to build the static site.
    echo.
)

pause 