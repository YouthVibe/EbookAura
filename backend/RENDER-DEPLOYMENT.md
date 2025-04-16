# Deploying to Render.com

This document provides instructions for deploying the EbookAura backend to Render.com and avoiding common deployment issues.

## Pre-Deployment Checks

Before deploying, run the pre-deployment check script to identify potential issues:

```bash
npm run pre-deploy
```

This script checks for:
- Case sensitivity issues in imports
- Proper model exports
- Error handling in controllers
- Required environment variables

Resolve any issues identified before proceeding with deployment.

## Setting Up a Web Service on Render

1. Create a new Web Service on Render.com
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `ebook-aura-backend` (or your preferred name)
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm run prestart-prod && npm start`
   - **Branch**: main (or your deployment branch)

## Environment Variables

Add the following environment variables in the Render dashboard:

- `PORT`: Typically Render assigns this, so you can leave it out
- `MONGO_URI`: Your MongoDB connection string
- `JWT_SECRET`: Secret for JWT token generation
- `JWT_EXPIRE`: JWT token expiration time (e.g., 30d)
- `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Your Cloudinary API key
- `CLOUDINARY_API_SECRET`: Your Cloudinary API secret
- `EMAIL_SERVICE`: Your email service
- `EMAIL_USERNAME`: Your email username
- `EMAIL_PASSWORD`: Your email password
- `EMAIL_FROM`: Your email from address
- `NODE_VERSION`: Set to 18.x or higher

## Common Deployment Issues

### Case Sensitivity in Filenames

One common issue when deploying to Render.com is case sensitivity in filenames. Windows and macOS file systems are case-insensitive by default, while Linux (which Render uses) is case-sensitive.

For example, if your code imports:
```javascript
const Book = require('../models/Book');
```

But your file is named `book.js` (lowercase), it will work locally on Windows but fail on Render.

### Solutions for Case Sensitivity Issues

1. **Use consistent naming**: Always use the same case in filenames and imports
2. **Run pre-deployment checks**: Use the provided script to check for case issues:
   ```
   npm run check-imports
   ```
3. **Fix mismatched cases**: Either rename your files or update your imports to match

### Model Export Patterns

We use a specific pattern for exporting Mongoose models to ensure compatibility:

```javascript
// Recommended pattern
const ModelName = mongoose.model('ModelName', modelSchema);
module.exports = ModelName;

// Instead of the direct export
module.exports = mongoose.model('ModelName', modelSchema);
```

The pre-deployment script checks for this pattern in all model files.

### Other Common Issues

1. **Port configuration**: Render assigns a PORT environment variable, so ensure your server listens on `process.env.PORT`
2. **MongoDB connection**: Ensure your MongoDB instance is accessible from Render (whitelist IP or use MongoDB Atlas)
3. **Node version**: Specify the Node.js version in your environment variables if needed

## Troubleshooting

If your deployment fails, check the following:

1. **Render logs**: Review the build and runtime logs in the Render dashboard
2. **Case sensitivity**: Run the import check script to find file naming issues
3. **Dependencies**: Ensure all dependencies are properly listed in package.json
4. **Environment variables**: Verify all required environment variables are set
5. **File paths**: Double-check file paths in your code, especially for imports

## Useful Commands

- Full pre-deployment check: `npm run pre-deploy`
- Check for case-sensitivity issues: `npm run check-imports`
- Prepare for production start: `npm run prestart-prod`
- Start with pre-checks: `npm run prestart-prod && npm start` 