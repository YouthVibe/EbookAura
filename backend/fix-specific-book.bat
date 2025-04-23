@echo off
echo Fix Premium Status for a Specific Book
echo ===================================
echo.

REM Check if book ID was provided
if "%~1"=="" (
  echo ERROR: Book ID is required.
  echo Usage: fix-specific-book.bat [book_id]
  echo.
  set /p BOOK_ID=Enter book ID to fix: 
) else (
  set BOOK_ID=%~1
)

echo.
echo Starting specific book fix for ID: %BOOK_ID%
cd %~dp0
node scripts/fix-specific-book.js %BOOK_ID%

if %ERRORLEVEL% EQU 0 (
  echo.
  echo Book fix completed successfully.
) else (
  echo.
  echo Error occurred while running book fix.
)

pause 