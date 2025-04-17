@echo off
echo 🚀 Building EbookAura static site...

:: Remove old build files
echo 🧹 Cleaning up old build files...
if exist .next rmdir /s /q .next
if exist out rmdir /s /q out

:: Install dependencies if needed
if not exist node_modules (
    echo 📦 Installing dependencies...
    call npm install
)

:: Install required build dependencies
echo 📦 Installing build dependencies...
call npm install cross-env rimraf --save-dev

:: Build the static site
echo 🔨 Building static site...
set NEXT_PUBLIC_API_URL=https://ebookaura.onrender.com/api
set STATIC_EXPORT=true
call npm run clean
call next build

:: Success message
echo ✅ Static site built successfully!
echo 📂 The static site files are in the 'out' directory
echo.
echo 🌐 To test the site locally, run: npm run serve
echo 🚀 To deploy, upload the contents of the 'out' directory to your hosting provider

pause 