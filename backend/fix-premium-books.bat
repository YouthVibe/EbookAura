@echo off
echo Starting premium books fix process...
cd %~dp0
node scripts/fix-premium-books.js
if %ERRORLEVEL% EQU 0 (
  echo Premium books fix process completed successfully.
) else (
  echo Error occurred while running premium books fix process.
)
pause 