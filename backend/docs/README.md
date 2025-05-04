# EbookAura Backend Documentation

Welcome to the comprehensive documentation for the EbookAura backend. This documentation covers all aspects of the backend system, from architecture to deployment and troubleshooting.

## Documentation Index

### System Overview

- [Architecture Overview](./ARCHITECTURE.md) - High-level overview of the backend architecture and components
- [API Endpoints](./API_ENDPOINTS.md) - Complete list of all API endpoints with request/response formats
- [Database Models](./DATABASE_MODELS.md) - Detailed documentation of the MongoDB data models
- [Controllers](./CONTROLLERS.md) - Business logic implementation for each API endpoint
- [Utilities and Middleware](./UTILITIES_AND_MIDDLEWARE.md) - Documentation of utility functions and middleware components

### Deployment and Operations

- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Instructions for deploying to various environments
- [Troubleshooting](./TROUBLESHOOTING.md) - Solutions for common issues and error scenarios

## Getting Started

If you're new to the EbookAura backend, follow these steps to get started:

1. Read the [Architecture Overview](./ARCHITECTURE.md) to understand the system structure
2. Check the [API Endpoints](./API_ENDPOINTS.md) to understand available functionality
3. Review the [Database Models](./DATABASE_MODELS.md) to understand data organization
4. Follow the [Deployment Guide](./DEPLOYMENT_GUIDE.md) to set up the application

## Key Features

- **RESTful API**: Well-structured API endpoints for all functionality
- **User Authentication**: JWT-based authentication system
- **File Handling**: Cloudinary integration for PDF and image storage
- **Premium Content**: Support for free and paid e-books
- **Virtual Currency**: Coin system for premium content purchases
- **Subscriptions**: Subscription plans for users
- **Admin Dashboard**: Administrative functionality
- **Static File Serving**: Integrated frontend serving

## System Requirements

- **Node.js**: Version 14.0.0 or higher
- **MongoDB**: Version 4.0 or higher
- **Cloudinary**: Account for file storage
- **Environment**: See `.env.example` for required configuration

## Development Workflow

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env` file
4. Run in development mode: `npm run dev`
5. Test API endpoints using Postman or similar tool

## Production Deployment

For production deployment, follow the detailed [Deployment Guide](./DEPLOYMENT_GUIDE.md).

Quick steps:
1. Configure environment variables
2. Build and prepare static files
3. Run production start script: `npm run deploy:render`

## Common Issues

Check the [Troubleshooting](./TROUBLESHOOTING.md) guide for solutions to common problems.

Most common issues are related to:
- Module not found errors (case sensitivity)
- Environment variable configuration
- Static file serving
- Cloudinary integration
- Premium book functionality

## Directory Structure

```
backend/
├── config/             # Configuration files
├── controllers/        # Request handlers
├── middleware/         # Express middleware
├── models/             # Database models
├── routes/             # API route definitions
├── utils/              # Utility functions
├── scripts/            # Utility scripts
├── temp/               # Temporary file storage
├── out/                # Static frontend files
├── docs/               # Documentation
├── server.js           # Main entry point
└── package.json        # Dependencies and scripts
```

## Contributing

When contributing to the EbookAura backend, please follow these guidelines:

1. Follow the existing code style and structure
2. Write meaningful commit messages
3. Include tests for new functionality
4. Update documentation for any changes
5. Use the appropriate error handling patterns

## License

Copyright (c) 2024 EbookAura. All rights reserved. 