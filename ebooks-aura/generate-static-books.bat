@echo off
echo Generating static book IDs list for Next.js static export...

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js is not installed or not in the PATH
    echo Please install Node.js and try again
    exit /b 1
)

REM Check if required packages are installed
echo Checking if required dependencies are installed...
cd /d "%~dp0"

REM Check for mongoose
echo Checking for mongoose...
node -e "try { require('mongoose'); console.log('Mongoose is installed'); } catch(e) { console.log('Installing mongoose...'); process.exit(1); }" >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Installing mongoose package...
    call npm install mongoose --no-save
    if %ERRORLEVEL% neq 0 (
        echo Error: Failed to install mongoose
        exit /b 1
    )
)

REM Check for dotenv
echo Checking for dotenv...
node -e "try { require('dotenv'); console.log('dotenv is installed'); } catch(e) { console.log('Installing dotenv...'); process.exit(1); }" >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Installing dotenv package...
    call npm install dotenv --no-save
    if %ERRORLEVEL% neq 0 (
        echo Error: Failed to install dotenv
        exit /b 1
    )
)

echo All dependencies installed successfully!

REM Run the script
echo Connecting to database and generating book IDs list...
node scripts/generate-static-books.js

if %ERRORLEVEL% neq 0 (
    echo Error: Failed to generate static book IDs
    exit /b 1
)

echo.
echo Static book IDs list generated successfully!
echo.
echo Next steps:
echo 1. Run 'build-static.bat' to build the static site with all book pages
echo 2. Or run 'build-static-windows.bat' for a more detailed build process
echo.

pause 