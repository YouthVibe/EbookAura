@echo off
echo.
echo === Fixing Node.js Version and Redeploying to Render.com ===
echo.
echo This script will:
echo 1. Update package.json to specify Node.js version constraint
echo 2. Create/update render.yaml with compatible Node.js version
echo 3. Commit and push changes to your repository
echo.
echo Note: You'll need to be logged into GitHub for this to work
echo.
echo Press Ctrl+C to cancel or any key to continue...
pause > nul

echo.
echo === 1. Updating package.json with Node.js version constraint ===
echo.

echo Updating Node.js engine specification in package.json...
powershell -Command "(Get-Content package.json) -replace '\"node\": \">=14.0.0\"', '\"node\": \">=14.0.0 <20.0.0\"' | Set-Content package.json"
echo Done.

echo.
echo === 2. Creating/updating render.yaml file ===
echo.

echo Creating render.yaml with Node.js v18.17.1 specification...
echo services: > render.yaml
echo   - type: web >> render.yaml
echo     name: ebookaura >> render.yaml
echo     env: node >> render.yaml
echo     buildCommand: cd backend ^&^& npm install >> render.yaml
echo     startCommand: cd backend ^&^& npm run deploy:render >> render.yaml
echo     nodeVersion: 18.17.1 >> render.yaml
echo     envVars: >> render.yaml
echo       - key: NODE_ENV >> render.yaml
echo         value: production >> render.yaml
echo       - key: RENDER >> render.yaml
echo         value: true >> render.yaml
echo Done.

echo.
echo === 3. Committing and pushing changes ===
echo.

git add package.json render.yaml
git commit -m "fix: specify Node.js version compatibility for Render.com"
git push

echo.
echo === Next Steps ===
echo.
echo 1. Go to your Render.com dashboard: https://dashboard.render.com/
echo 2. Navigate to your Web Service (ebookaura)
echo 3. Click "Manual Deploy" > "Clear build cache & deploy"
echo.
echo If you still encounter issues, please refer to backend/NODE-VERSION-FIX.md
echo for additional troubleshooting steps.
echo.

pause 