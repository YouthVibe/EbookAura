@echo off
echo ===================================================
echo EbookAura Activity Reward Update Script
echo ===================================================
echo.
echo This script will update the activity reward from 1 coin to 5 coins per minute.
echo.
echo Press Ctrl+C to cancel or any key to continue...
pause > nul

cd /d "%~dp0"
node scripts/update-activity-reward.js

if %ERRORLEVEL% neq 0 (
    echo.
    echo Error: Failed to update activity reward! See error message above.
    echo.
    pause
    exit /b 1
)

echo.
echo ===================================================
echo Activity reward successfully updated to 5 coins per minute!
echo.
echo You will need to restart the backend server for changes to take effect.
echo ===================================================
echo.
pause 