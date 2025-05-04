# API Key Authentication System

This document provides an overview of the API key authentication system implemented in EbookAura.

## Overview

The API key authentication system allows users to generate API keys that can be used to authenticate API requests without requiring a login session. This is particularly useful for:

- External applications that need to access EbookAura content
- Automated scripts or tools that need to access the API
- Integrations with other services

## Features

- **API Key Generation**: Users can generate API keys from their account settings
- **API Key Management**: View, revoke, and regenerate API keys
- **Subscription Verification**: API keys are linked to the user's subscription status
- **Access Control**: API keys only provide access to resources the user has permission to access
- **PDF Access**: PDF content can be accessed using API keys if the user has a valid subscription

## Backend Components

### Models

- `User.js`: Includes an `apiKey` field and methods to generate and validate API keys

### Controllers

- `apiKeyController.js`: Handles API key operations:
  - `generateApiKey`: Creates a new API key for the user
  - `getCurrentApiKey`: Retrieves the current API key
  - `revokeApiKey`: Revokes an existing API key
  - `verifyApiKey`: Verifies an API key and returns user information

- `subscriptionController.js`: Handles subscription operations:
  - `checkSubscription`: Checks if the user has an active subscription
  - `checkSubscriptionByApiKey`: Checks subscription status using an API key

### Middleware

- `apiKeyAuth.js`: Middleware to authenticate requests using API keys
- `subscriptionVerification.js`: Middleware to verify subscription status

### Routes

- `apiKeyRoutes.js`: Defines routes for API key management
- `subscriptionRoutes.js`: Defines routes for subscription management

## Frontend Components

### API Utilities

- `api/apiKeys.js`: Client-side utilities for API key operations:
  - `getCurrentApiKey`: Gets the user's current API key
  - `generateApiKey`: Generates a new API key
  - `revokeApiKey`: Revokes the current API key
  - `verifyApiKey`: Verifies an API key
  - `getPdfUrlWithApiKey`: Generates a URL for accessing a PDF with an API key

- `api/subscriptions.js`: Client-side utilities for subscription operations:
  - `getCurrentSubscription`: Gets the user's current subscription
  - `checkSubscriptionWithApiKey`: Checks subscription status using an API key

### UI Components

- `components/profile/ApiKeyManager.jsx`: Full API key management UI
- `components/profile/SimpleApiKeyManager.jsx`: Simplified API key management for the settings page
- `components/profile/SubscriptionStatus.jsx`: Displays subscription status

### Pages

- `profile/api-keys/page.js`: API key management page
- `profile/api-keys/docs/page.js`: API documentation page
- `settings/page.js`: Settings page with API key and subscription management

## Usage Examples

### Accessing a PDF with an API Key

```javascript
// Using fetch
const apiKey = 'your_api_key';
const bookId = 'book_id';

fetch(`https://api.ebookaura.com/api/books/${bookId}/pdf`, {
  headers: {
    'X-API-Key': apiKey
  }
})
.then(response => response.blob())
.then(blob => {
  // Handle PDF blob
});
```

### Creating a URL with an API Key

```javascript
// Generate a URL with API key for direct access
const apiKey = 'your_api_key';
const bookId = 'book_id';
const url = `https://ebookaura.com/books/${bookId}?apiKey=${apiKey}`;
```

## Security Considerations

- API keys are stored securely with one-way hashing
- API keys are masked when displayed in the UI (only displayed in full when generated)
- API keys are scoped to the user's permissions and subscription status
- API keys can be revoked at any time
- Rate limiting is applied to API key requests

## Implementation Notes

- API keys are prefixed with `ak_` for easy identification
- API keys have a long, random string format for security
- Subscription status is verified on each request using an API key
- Cached subscription status may be used to reduce API calls

---

For more information, see the [API Documentation](https://ebookaura.com/profile/api-keys/docs). 