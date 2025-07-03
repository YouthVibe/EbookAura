@echo off
echo === EbookAura Production Build Script ===
echo.
echo This script will prepare and build the production version of EbookAura frontend.
echo.

REM Update environment variables
echo Setting production environment variables...
echo # Production build configuration> .env
echo NEXT_PUBLIC_API_URL=/api>> .env
echo STATIC_EXPORT=true>> .env
echo NEXT_PUBLIC_APP_URL=https://ebookaura.onrender.com>> .env

REM Update API URLs
echo Running API URL configuration check...
node update-api-urls.js

REM Clean the build directory
echo Cleaning build directory...
if exist out rmdir /s /q out

REM Run production build
echo.
echo Building production version...
call npm run build

echo.
echo Production build completed! The output is in the 'out' directory.
echo.
echo Copy this 'out' directory to the backend server's static files folder.
echo.
pause 