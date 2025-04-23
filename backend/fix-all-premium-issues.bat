@echo off
echo Starting comprehensive premium book fixes...
cd %~dp0

echo.
echo ========================================
echo Step 1: Fixing premium books with price issues
echo ========================================
echo.
call fix-premium-books.bat

echo.
echo ========================================
echo Step 2: Fixing book prices
echo ========================================
echo.
call fix-book-prices.bat

echo.
echo ========================================
echo Step 3: Fixing book purchases
echo ========================================
echo.
call fix-book-purchases.bat

echo.
echo ========================================
echo Step 4: Fixing user purchases
echo ========================================
echo.
call fix-user-purchases.bat

echo.
echo ========================================
echo All fixes completed!
echo ========================================
echo.
echo Premium book system should now be functioning correctly.
echo.
pause 