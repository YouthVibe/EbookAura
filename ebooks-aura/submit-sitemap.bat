@echo off
SETLOCAL

REM Sitemap Submission Script
REM This script notifies search engines about your sitemap for faster indexing

echo ===================================
echo EbookAura Sitemap Submission
echo ===================================

REM Check if node is installed
WHERE node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
  echo Node.js is not installed or not in PATH. Please install Node.js.
  exit /b 1
)

REM Set the environment variables if they're not already set
IF "%NEXT_PUBLIC_APP_URL%"=="" (
  echo NOTE: NEXT_PUBLIC_APP_URL environment variable is not set.
  echo Using default: https://ebookaura.onrender.com
  SET "NEXT_PUBLIC_APP_URL=https://ebookaura.onrender.com"
)

echo Submitting sitemap to search engines: %NEXT_PUBLIC_APP_URL%/sitemap.xml
echo This will notify Google, Bing, and Yandex about your sitemap.
echo.

REM Run the submission script
node scripts/submit-sitemap.js
IF %ERRORLEVEL% NEQ 0 (
  echo The script encountered an error. See above for details.
  echo Check the log file at scripts/sitemap-submission-log.txt for more information.
  exit /b 1
)

echo.
echo Sitemap submission completed. Check scripts/sitemap-submission-log.txt for details.
echo.
echo NOTE: You should also manually submit your sitemap in these webmaster tools:
echo - Google Search Console: https://search.google.com/search-console
echo - Bing Webmaster Tools: https://www.bing.com/webmasters
echo - Yandex Webmaster: https://webmaster.yandex.com
echo.

ENDLOCAL 