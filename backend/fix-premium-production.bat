@echo off
echo ========================================
echo     PREMIUM BOOK PRODUCTION FIX
echo ========================================
echo.
echo This script will fix premium book issues in production.
echo It ensures proper serialization and handling of premium properties.
echo.
echo Press Ctrl+C to cancel or...
pause

echo.
echo Running fix-premium-production.js...
echo.
node fix-premium-production.js

echo.
echo Fix complete!
echo.
echo After deploying to production, test by:
echo 1. Checking premium books in the book listing 
echo 2. Accessing individual premium book details
echo 3. Verifying purchase functionality
echo.
pause 