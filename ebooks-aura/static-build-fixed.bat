@echo off
echo.
echo ===================================
echo EbookAura Static Build Generation
echo ===================================
echo.

echo Setting environment variables for static export...
set STATIC_EXPORT=true
set NODE_ENV=production

echo Cleaning previous builds...
call npx rimraf .next out

echo Configuring API routes for static export...
call node disable-static-api.js

echo Building for static export...
call npx cross-env STATIC_EXPORT=true NODE_ENV=production NEXT_PUBLIC_API_URL=https://ebookaura.onrender.com/api next build

if %ERRORLEVEL% neq 0 (
  echo Build failed with error code %ERRORLEVEL%
  exit /b %ERRORLEVEL%
)

echo.
echo ===================================
echo Static build completed successfully!
echo ===================================
echo.
echo Your static files are in the "out" directory
echo You can serve them with: npm run serve
echo.

pause 