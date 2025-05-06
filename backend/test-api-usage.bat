@echo off
echo Testing API key usage tracking...
echo.

:: Set working directory to backend folder
cd /d "%~dp0"

:: Run the test script
node scripts/test-api-usage.js

echo.
echo Test completed. Press any key to exit...
pause > nul 