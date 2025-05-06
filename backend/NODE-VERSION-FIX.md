# Fixing Node.js Version Compatibility Issues on Render.com

## Issue

The EbookAura application is encountering an error when deploying to Render.com with Node.js v24.0.0:

```
TypeError: Cannot read properties of undefined (reading 'prototype')
    at Object.<anonymous> (/opt/render/project/src/backend/node_modules/buffer-equal-constant-time/index.js:37:35)
```

This error occurs because Node.js v24.0.0 has removed some older Buffer APIs that the `buffer-equal-constant-time` package (a dependency of `jsonwebtoken`) relies on.

## Solution

### Option 1: Specify an Earlier Node.js Version (Recommended)

1. Go to your Render.com dashboard
2. Navigate to your Web Service (ebookaura)
3. Go to "Settings" tab
4. Under "Environment" section, set "Node Version" to `18.17.1`
5. Click "Save Changes"
6. Click "Manual Deploy" > "Clear build cache & deploy"

### Option 2: Use render.yaml Configuration (For New Deployments)

We've added a `render.yaml` file to the repository that specifies Node.js v18.17.1 for Render.com deployments. If you're creating a new deployment, Render.com will automatically use this configuration.

### Option 3: Update package.json (Already Done)

We've updated the `package.json` file to specify a compatible Node.js version range:

```json
"engines": {
  "node": ">=14.0.0 <20.0.0"
}
```

This tells Render.com to use a Node.js version within this range.

## Why This Works

Node.js has been aggressively improving and modernizing the runtime in recent versions. Some older APIs, particularly around Buffer handling, were removed or changed in Node.js v24.0.0.

The `jsonwebtoken` package (and its dependency `buffer-equal-constant-time`) were written when these older APIs were still available. While these packages will eventually update to support newer Node.js versions, using Node.js v18.x is currently the most stable option for running this application.

## Additional Information

If you wish to use Node.js v24.0.0 or newer in the future, you'll need to update the following dependencies to versions that support these newer Node.js versions:

- `jsonwebtoken`
- `buffer-equal-constant-time`
- Any other dependencies using older Buffer APIs

## References

- [Node.js v24.0.0 Release Notes](https://nodejs.org/en/blog/release/v24.0.0)
- [Render.com Node.js Version Documentation](https://render.com/docs/node-version) 