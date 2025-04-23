@echo off
echo Starting book prices fix process...
cd %~dp0
node scripts/fix-book-prices.js
if %ERRORLEVEL% EQU 0 (
  echo Book prices fix process completed successfully.
) else (
  echo Error occurred while running book prices fix process.
)
pause 