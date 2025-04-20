@echo off
echo === Book Information Update Utility ===
echo.
echo This script will update book information in the database.

echo.
echo 1. Update specific book (ID: 6804b6d03fe6058b5b3dd4a8)
echo 2. Update all books missing file size information
echo 3. Exit
echo.

set /p choice=Enter your choice (1-3): 

if "%choice%"=="1" (
    echo.
    echo Updating specific book...
    node scripts/update-specific-book.js
) else if "%choice%"=="2" (
    echo.
    echo Updating all books...
    node scripts/update-pdf-sizes.js
) else if "%choice%"=="3" (
    echo Exiting...
    exit /b 0
) else (
    echo Invalid choice.
    exit /b 1
)

echo.
echo Process completed.
pause 