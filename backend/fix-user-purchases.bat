@echo off
echo Starting user purchases fix process...
cd %~dp0
node scripts/fix-user-purchases.js
if %ERRORLEVEL% EQU 0 (
  echo User purchases fix process completed successfully.
) else (
  echo Error occurred while running user purchases fix process.
)
pause 