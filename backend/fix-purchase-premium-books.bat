@echo off
echo ========================================
echo    PURCHASED BOOKS PREMIUM STATUS FIX
echo ========================================
echo.
echo This script will fix premium status for books that have purchase records.
echo It ensures that any book that has been purchased is properly marked as premium.
echo.
echo Press Ctrl+C to cancel or...
pause

echo.
echo Running fix-purchase-premium-books.js...
echo.
node fix-purchase-premium-books.js

echo.
echo Fix complete!
echo.
echo After running this script, users should be able to purchase premium books correctly.
echo.
pause 