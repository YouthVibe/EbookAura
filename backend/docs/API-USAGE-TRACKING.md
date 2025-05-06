# API Key Usage Tracking System

This document explains how the API key usage tracking system works in EbookAura.

## Overview

The API key usage tracking system monitors and limits the number of requests made by each API key to prevent abuse and ensure fair usage. The system tracks:

1. Number of book searches performed each day
2. Number of reviews posted each day

Each API key has configurable daily limits for these operations. When a limit is reached, further requests of that type will be rejected until the counters reset at midnight UTC.

## Implementation Details

### Models

#### ApiKey Model

The `ApiKey` model includes fields for usage tracking:

```javascript
{
  // Other fields...
  limits: {
    booksPerDay: { type: Number, default: 50 },
    reviewsPerDay: { type: Number, default: 10 }
  },
  usage: {
    booksSearched: { type: Number, default: 0 },
    reviewsPosted: { type: Number, default: 0 },
    lastReset: { type: Date, default: Date.now }
  },
  lastUsed: { type: Date }
}
```

#### ApiKeyUsageHistory Model

The `ApiKeyUsageHistory` model stores historical usage data for analytics and reporting:

```javascript
{
  apiKey: { type: mongoose.Schema.Types.ObjectId, ref: 'ApiKey', required: true },
  date: { type: Date, required: true, default: Date.now },
  booksSearched: { type: Number, default: 0 },
  reviewsPosted: { type: Number, default: 0 },
  additionalMetrics: { type: Map, of: Number, default: {} }
}
```

### Tracking Middleware

The system uses two middleware functions to track usage:

1. **trackBookSearchUsage**: Increments the `booksSearched` counter when API keys are used to search for books.
2. **trackReviewPostingUsage**: Increments the `reviewsPosted` counter when API keys are used to post reviews.

These middleware functions:
- Check if the daily limit has been reached
- Increment the appropriate usage counter
- Update the `lastUsed` timestamp
- Save the changes to the database
- Record the usage in the historical data collection
- Log usage information for debugging

```javascript
// Example middleware (simplified)
const trackBookSearchUsage = async (req, res, next) => {
  const apiKey = req.apiKey;
  
  // Check limits
  if (apiKey.usage.booksSearched >= apiKey.limits.booksPerDay) {
    res.status(429);
    throw new Error(`Daily limit for book searches has been reached`);
  }
  
  // Increment usage counter
  apiKey.usage.booksSearched += 1;
  apiKey.lastUsed = Date.now();
  
  // Save to the database
  await apiKey.save();
  
  // Record in history
  await ApiKeyUsageHistory.recordUsage(apiKey._id, { booksSearched: 1 });
  
  console.log(`API key used: ${apiKey.usage.booksSearched}/${apiKey.limits.booksPerDay} book searches today`);
  
  next();
};
```

### Auto-Reset Mechanism

The `resetUsageIfNeeded` method in the ApiKey model resets the usage counters when a day has passed since the last reset:

```javascript
apiKeySchema.methods.resetUsageIfNeeded = function() {
  const now = new Date();
  const lastReset = new Date(this.usage.lastReset);
  
  // Check if the last reset was on a different day (in UTC)
  if (now.toDateString() !== lastReset.toDateString()) {
    this.usage.booksSearched = 0;
    this.usage.reviewsPosted = 0;
    this.usage.lastReset = now;
    
    return true; // Indicates that a reset occurred
  }
  
  return false; // No reset needed
};
```

### Historical Data Collection

The system automatically records API key usage in a separate collection to allow for historical analysis:

- Daily usage data is stored for each API key
- The system provides methods to retrieve and analyze historical data
- Usage statistics are calculated from the historical data, including:
  - Daily usage for the past week
  - Daily averages
  - Peak usage
  - Total usage over time
  - Days with activity

## Rate Limiting Response

When a user exceeds their daily limit, they receive a 429 (Too Many Requests) response with details about the rate limit:

```json
{
  "message": "Daily book search limit reached",
  "code": "RATE_LIMIT_EXCEEDED",
  "limit": 50,
  "used": 50,
  "reset": "2023-10-15T00:00:00.000Z",
  "resetIn": "5 hours"
}
```

## Frontend Integration

### API Key Usage Display

The frontend displays API key usage information on the `/profile/api-keys` page:
- Current usage counters with visual progress bars
- Last reset time
- Last used time
- API key limits
- A "View Analytics" button to access detailed usage statistics

### API Key Analytics Page

The Analytics page at `/profile/api-keys/[id]/analytics` provides detailed information about API key usage:
- Daily usage graphs for the past week
- Usage trends over time
- Daily averages
- Peak usage statistics
- API key details and limits

The analytics interface automatically refreshes to show the latest data when requested by the user.

## Testing

You can test the API usage tracking system using the provided script:

1. Run the test script with `node backend/scripts/test-api-usage.js` or use the `test-api-usage.bat` file.
2. The script will create a test user and API key, then simulate various API calls.
3. It will also generate historical usage data for testing the analytics features.
4. The script outputs detailed information about the API key's usage and limits.

## Customizing Limits

API key limits can be customized by administrators through the admin interface or directly in the database. The default limits are:

- 50 book searches per day
- 10 review posts per day 