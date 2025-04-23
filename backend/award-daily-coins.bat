@echo off
echo Starting daily coin award process...
cd %~dp0
node scripts/awardDailyCoins.js
if %ERRORLEVEL% EQU 0 (
  echo Daily coin award process completed successfully.
) else (
  echo Error occurred while running daily coin award process.
)
pause 