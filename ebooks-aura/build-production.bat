@echo off
echo === EbookAura Production Build ===
echo.
echo This script will build the EbookAura frontend for production.
echo.
echo Checking configuration...

REM Check if .env file exists
if not exist .env (
  echo Creating .env file with production settings...
  echo # Production API URL > .env
  echo NEXT_PUBLIC_API_URL=https://ebookaura.onrender.com/api >> .env
  echo STATIC_EXPORT=true >> .env
) else (
  echo Updating .env file with production settings...
  powershell -Command "(Get-Content .env) -replace '# NEXT_PUBLIC_API_URL=https://ebookaura.onrender.com/api', 'NEXT_PUBLIC_API_URL=https://ebookaura.onrender.com/api' | Set-Content .env"
  powershell -Command "(Get-Content .env) -replace 'NEXT_PUBLIC_API_URL=http://localhost:5000/api', '# NEXT_PUBLIC_API_URL=http://localhost:5000/api' | Set-Content .env"
)

REM Check config.js file
echo Verifying API configuration in source files...
powershell -Command "(Get-Content src/app/utils/config.js) -replace 'export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL \|\| ''http://localhost:5000/api'';', '// export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''http://localhost:5000/api'';' | Set-Content src/app/utils/config.js"
powershell -Command "(Get-Content src/app/utils/config.js) -replace '// export const API_BASE_URL = ''https://ebookaura.onrender.com/api'';', 'export const API_BASE_URL = ''https://ebookaura.onrender.com/api'';' | Set-Content src/app/utils/config.js"

echo.
echo Building production version...
echo.

REM Run build
call npm run build

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo Build failed with error level %ERRORLEVEL%
  echo.
  pause
  exit /b %ERRORLEVEL%
)

echo.
echo Production build completed successfully!
echo The build is available in the 'out' directory.
echo.
pause 