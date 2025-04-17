# How to Fix the Maintenance Page Issue on Render.com

This guide will help you fix the "Site Maintenance" page currently showing at https://ebookaura.onrender.com/ and properly serve your static frontend files from the backend.

## Quick Solution

1. Open the Render.com dashboard
2. Navigate to your Web Service (ebookaura)
3. Open the Shell tab
4. Run these commands:

```bash
cd backend
node setup-render.js
```

5. Restart your service from the Render dashboard

## Detailed Steps

### 1. Update Your Render.com Environment Variables

1. Go to Render.com dashboard
2. Click on your Web Service
3. Go to "Environment" tab
4. Add these environment variables if they don't exist:
   - `RENDER` = `true`
   - `FORCE_STATIC_GENERATION` = `true`
   - `NODE_ENV` = `production`
5. Click "Save Changes"

### 2. Use the Render Shell to Create Static Files

1. Go to the "Shell" tab
2. Run these commands:

```bash
# Navigate to the backend directory
cd backend

# Check if the directory structure is correct
ls -la

# Create the out directory if it doesn't exist
mkdir -p out

# Verify the out directory exists
ls -la out

# Create a basic index.html file in the out directory
cat > out/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EbookAura - Maintenance</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f9fafb;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            text-align: center;
        }
        .container {
            max-width: 600px;
            padding: 2rem;
            background-color: white;
            border-radius: 1rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            margin: 1rem;
        }
        .logo {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
        }
        .logo-ebook { color: #111827; }
        .logo-aura { color: #ef4444; }
        h1 { color: #111827; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <span class="logo-ebook">Ebook</span><span class="logo-aura">Aura</span>
        </div>
        <h1>Welcome to EbookAura</h1>
        <p>Your digital book platform is ready!</p>
    </div>
</body>
</html>
EOF

# Verify the file was created
cat out/index.html
```

### 3. Update Your Start Command

1. Go to the "Settings" tab in your Render.com dashboard
2. Under "Build & Deploy" section
3. Change your Start Command to:
   ```
   cd backend && npm run start:render
   ```
4. Click "Save Changes"

### 4. Restart Your Service

1. Click the "Manual Deploy" button
2. Select "Clear build cache & deploy"
3. Wait for the deployment to complete

### 5. Verify It Works

1. Visit your Render URL (https://ebookaura.onrender.com/)
2. You should now see your frontend instead of the maintenance page
3. If you still see the maintenance page, check the logs for any errors

## How to Deploy Your Actual Frontend

Once the above steps are working, you can deploy your actual frontend:

1. Locally build your frontend:
   ```bash
   cd ebooks-aura
   npm run build:static:prod
   ```

2. Copy the generated files to your Render service using either:

   **Option A: Upload via Render Shell**
   1. Zip your local `out` directory
   2. Upload the zip to Render using the Shell's file upload feature
   3. In the Shell, unzip the files to the backend/out directory:
      ```bash
      cd backend
      rm -rf out/*
      unzip ~/uploaded-file.zip -d out/
      ```

   **Option B: GitHub Deployment**
   1. Copy your frontend build to the backend/out directory
   2. Commit and push to GitHub
   3. Render will automatically deploy the updated files

## Troubleshooting

### If Static Files Still Don't Appear:

1. Check Render logs for errors
2. Make sure the out directory contains an index.html file
3. Verify environment variables are set correctly
4. Run the setup script again:
   ```bash
   cd backend
   node setup-render.js
   ```

### API Routes Not Working:

Make sure all API endpoints are prefixed with `/api` in your code.

### Need More Help?

If you're still having issues:
1. Check the server logs in the Render dashboard
2. Clear the build cache and redeploy
3. Contact Render support if necessary 