@echo off
echo Testing Book Review Functionality
echo ==============================

REM Check if token is provided
if "%1"=="" (
  echo Please provide a JWT token as the first argument
  echo Usage: test-review.bat [jwtToken] [bookId]
  exit /b 1
)

REM Set token and book ID
set TOKEN=%1
set BOOK_ID=%2

REM If book ID is not provided, use default
if "%BOOK_ID%"=="" (
  set BOOK_ID=681647e41a7f345409452ab2
  echo Using default book ID: %BOOK_ID%
) else (
  echo Using provided book ID: %BOOK_ID%
)

echo Using token: %TOKEN%
echo.

REM Run the test script
node test-review-post.js %BOOK_ID% %TOKEN%

REM Check the exit code
if %ERRORLEVEL% neq 0 (
  echo.
  echo Test failed with error code %ERRORLEVEL%
  exit /b %ERRORLEVEL%
) else (
  echo.
  echo Test completed successfully
) 