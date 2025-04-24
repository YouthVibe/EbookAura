# Premium Book Fix Guide

This guide explains how to fix issues with premium book features not appearing in production.

## Background

Premium books have two key properties:
- `isPremium: true` - Flag indicating this is a premium book
- `price: 25` (or other amount) - The price in coins

In MongoDB, the `price` field is often stored as a `NumberLong` type, which gets serialized as:
```json
{
  "price": {
    "$numberLong": "25"
  }
}
```

## Production Issues

When the static frontend is built and served from the backend on Render.com, there can be issues with:

1. **Data serialization**: MongoDB types might not be properly converted to JavaScript types
2. **API URL consistency**: The frontend might use incorrect API URLs in production
3. **Type handling**: Boolean flags might be inconsistently handled

## Fix Guide

### 1. Run the Premium Book Fix Script

Run `fix-premium-books.bat` to check and fix all premium books in the database:

```
> fix-premium-books.bat
```

This script:
- Finds books with price > 0 but isPremium ≠ true and fixes them
- Finds books with isPremium = true but no price and sets a default
- Updates all premium books to have consistent data

### 2. Ensure Environment Variables in Frontend

Set the proper environment variables in `.env`:

```
NEXT_PUBLIC_API_URL=https://ebookaura.onrender.com/api
STATIC_EXPORT=true
```

### 3. Update API URLs

Run the API URL update script to ensure consistency:

```
> node update-api-urls.js
```

### 4. Rebuild the Frontend

Use the production build script:

```
> build-production.bat
```

### 5. Deploy to Render.com

Copy the `out` directory to your backend static files folder, then deploy to Render.com.

## Debugging Tools

### Client-Side Debug Mode

In production, you can:

1. Add `?debug=true` to any book URL to enter debug mode
2. Press `Ctrl+Shift+P` twice on any book page to toggle debug mode
3. Use the "Force Premium Check" button to diagnose and fix issues

### Browser Console Utility

Load a book page and type in the browser console:

```javascript
debugPremium()
```

This will analyze the current book data and suggest fixes.

## Common Issues and Solutions

### Issue: Premium Book Shows No Price

This often happens when:
- The book has `isPremium: true` but no `price` field
- The MongoDB `NumberLong` isn't being properly parsed

**Solution**: Use the "Force Premium Check" in debug mode to set a default price.

### Issue: Book Has Price But Isn't Premium

This happens when:
- The book has `price > 0` but `isPremium: false` or missing

**Solution**: Run the `fix-premium-books.bat` script to update all books with this issue.

### Issue: User Has Purchased But Can't Access

This happens when:
- The book purchase record exists but isn't being properly checked

**Solution**: Use the "Force Check Login" function in debug mode to refresh auth state.

## Need More Help?

If you encounter persistent issues, you can:

1. Run backend scripts directly with Node (e.g., `node fix-specific-book.js [BOOK_ID]`)
2. Check the MongoDB data directly using MongoDB Compass
3. Check the frontend console logs for serialization issues 