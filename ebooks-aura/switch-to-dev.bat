@echo off
echo === EbookAura Development Mode Setup ===
echo.
echo This script will switch EbookAura frontend to development mode.
echo.
echo Updating configuration...

REM Update .env file
echo Updating .env file with development settings...
powershell -Command "(Get-Content .env) -replace 'NEXT_PUBLIC_API_URL=https://ebookaura.onrender.com/api', '# NEXT_PUBLIC_API_URL=https://ebookaura.onrender.com/api' | Set-Content .env"
powershell -Command "(Get-Content .env) -replace '# NEXT_PUBLIC_API_URL=http://localhost:5000/api', 'NEXT_PUBLIC_API_URL=http://localhost:5000/api' | Set-Content .env"

REM Update config.js file
echo Updating API configuration in source files...
powershell -Command "(Get-Content src/app/utils/config.js) -replace '// Fallback options commented out', '// Development URL (active)' | Set-Content src/app/utils/config.js"
powershell -Command "(Get-Content src/app/utils/config.js) -replace '// export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL \|\| ''http://localhost:5000/api'';', 'export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''http://localhost:5000/api'';' | Set-Content src/app/utils/config.js"
powershell -Command "(Get-Content src/app/utils/config.js) -replace '// Use the production API URL directly', '// Production URL (commented out)' | Set-Content src/app/utils/config.js"
powershell -Command "(Get-Content src/app/utils/config.js) -replace 'export const API_BASE_URL = ''https://ebookaura.onrender.com/api'';', '// export const API_BASE_URL = ''https://ebookaura.onrender.com/api'';' | Set-Content src/app/utils/config.js"

REM Update apiUtils.js file
echo Updating API utilities...
powershell -Command "(Get-Content src/app/api/apiUtils.js) -replace '// Fallback options commented out', '// Use API URL from environment variables with fallback' | Set-Content src/app/api/apiUtils.js"
powershell -Command "(Get-Content src/app/api/apiUtils.js) -replace '// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL \|\| ''http://localhost:5000/api'';', 'const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''http://localhost:5000/api'';' | Set-Content src/app/api/apiUtils.js"
powershell -Command "(Get-Content src/app/api/apiUtils.js) -replace '// Use the production API URL directly', '// Production URL (commented out)' | Set-Content src/app/api/apiUtils.js"
powershell -Command "(Get-Content src/app/api/apiUtils.js) -replace 'const API_BASE_URL = ''https://ebookaura.onrender.com/api'';', '// const API_BASE_URL = ''https://ebookaura.onrender.com/api'';' | Set-Content src/app/api/apiUtils.js"

echo.
echo Running API URL configuration check...
node check-api-urls.js

echo.
echo Configuration updated successfully!
echo You can now run the development server with 'npm run dev'
echo.
pause 