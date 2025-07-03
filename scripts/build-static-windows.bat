@echo off
setlocal enabledelayedexpansion

REM EbookAura Static Site Builder for Windows
REM This script builds a static version of the EbookAura frontend

echo [92mStarting EbookAura static site build process...[0m

REM Check if we're in the right directory
if not exist package.json (
    echo [91mError: package.json not found![0m
    echo [93mPlease run this script from the ebooks-aura directory.[0m
    exit /b 1
)

REM Clean up previous build
echo [93mCleaning up previous build files...[0m
if exist .next (
    rmdir /s /q .next
    echo Removed .next directory
)

if exist out (
    rmdir /s /q out
    echo Removed out directory
)

REM Create or update .env file
echo [93mSetting up environment variables...[0m
echo NEXT_PUBLIC_API_URL=https://ebookaura.onrender.com/api > .env
echo STATIC_EXPORT=true >> .env

echo [93mEnvironment variables set:[0m
echo NEXT_PUBLIC_API_URL=https://ebookaura.onrender.com/api
echo STATIC_EXPORT=true

REM Check if node_modules exists
if not exist node_modules (
    echo [93mInstalling dependencies...[0m
    call npm install
    if !errorlevel! neq 0 (
        echo [91mFailed to install dependencies![0m
        exit /b 1
    )
)

REM Generate static book IDs
echo [93mGenerating static book IDs list...[0m
node scripts/generate-static-books.js
if %errorlevel% neq 0 (
    echo [91mFailed to generate static book IDs list![0m
    echo Please check the error messages above.
    exit /b 1
)

REM Build the static site
echo [93mBuilding static site...[0m
call npx cross-env NEXT_PUBLIC_API_URL=https://ebookaura.onrender.com/api STATIC_EXPORT=true next build
if %errorlevel% neq 0 (
    echo [91mBuild failed![0m
    echo Please check the error messages above.
    exit /b 1
)

REM Check if build was successful
if exist out (
    echo [92mBuild completed successfully![0m
    echo [93mTo test the static site locally:[0m
    echo   npx serve out
    echo [93mTo deploy:[0m
    echo   - Upload the contents of the 'out' directory to your web server
    echo   - Or deploy to GitHub Pages, Netlify, Vercel, etc.
) else (
    echo [91mBuild output directory not found![0m
    echo Build may have failed. Please check the error messages above.
    exit /b 1
)

pause 