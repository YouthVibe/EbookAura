@echo off
echo Starting book purchases fix process...
cd %~dp0
node scripts/fix-book-purchases.js
if %ERRORLEVEL% EQU 0 (
  echo Book purchases fix process completed successfully.
) else (
  echo Error occurred while running book purchases fix process.
)
pause 