@echo off
echo Creating static book IDs file directly...

REM Ensure we're in the right directory
cd /d "%~dp0"

REM Make sure the target directory exists
if not exist src\app\utils mkdir src\app\utils

REM Get current date and time for the file header
set year=%date:~10,4%
set month=%date:~4,2%
set day=%date:~7,2%
set hour=%time:~0,2%
if "%hour:~0,1%" == " " set hour=0%hour:~1,1%
set minute=%time:~3,2%
set second=%time:~6,2%
set timestamp=%year%-%month%-%day%T%hour%:%minute%:%second%

echo Creating STATIC_BOOKS.js file with critical IDs...
echo /** > src\app\utils\STATIC_BOOKS.js
echo  * This file contains a list of all book IDs for static generation >> src\app\utils\STATIC_BOOKS.js
echo  * Generated on: %timestamp% >> src\app\utils\STATIC_BOOKS.js
echo  * >> src\app\utils\STATIC_BOOKS.js
echo  * For static exports, we must pre-render ALL book pages that users might access >> src\app\utils\STATIC_BOOKS.js
echo  */ >> src\app\utils\STATIC_BOOKS.js
echo. >> src\app\utils\STATIC_BOOKS.js
echo const STATIC_BOOKS = [ >> src\app\utils\STATIC_BOOKS.js
echo   // Critical book IDs that must always be included >> src\app\utils\STATIC_BOOKS.js
echo   '681859bd560ce1fd792c2745',  // The problematic ID that was missing before >> src\app\utils\STATIC_BOOKS.js
echo   '6807c9d24fb1873f72080fb1',  // Another critical ID >> src\app\utils\STATIC_BOOKS.js
echo   '6807be6cf05cdd8f4bdf933c',  // Critical book ID >> src\app\utils\STATIC_BOOKS.js
echo   '6803d0c8cd7950184b1e8cf3',  // Critical book ID >> src\app\utils\STATIC_BOOKS.js
echo ]; >> src\app\utils\STATIC_BOOKS.js
echo. >> src\app\utils\STATIC_BOOKS.js
echo export default STATIC_BOOKS; >> src\app\utils\STATIC_BOOKS.js

echo.
echo STATIC_BOOKS.js file created successfully!
echo Location: src\app\utils\STATIC_BOOKS.js
echo.
echo The following critical book IDs were included:
echo - 681859bd560ce1fd792c2745 (previously problematic ID)
echo - 6807c9d24fb1873f72080fb1
echo - 6807be6cf05cdd8f4bdf933c
echo - 6803d0c8cd7950184b1e8cf3
echo.
echo Next steps:
echo 1. Run 'verify-book-params.bat' to verify the IDs were added correctly
echo 2. Run 'build-static.bat' to build the static site
echo.

pause 