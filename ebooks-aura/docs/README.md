# EbookAura Frontend Documentation

This documentation provides a comprehensive overview of the EbookAura frontend application, including its architecture, components, features, and deployment instructions.

## Documentation Index

### System Architecture

- [Architecture Overview](./ARCHITECTURE.md) - Comprehensive overview of the frontend architecture, including system design, technologies, and key features.

### Components and Modules

- [Component Documentation](./COMPONENTS.md) - Detailed documentation of all frontend components, their purposes, props, and usage patterns.

### Integration

- [API Integration](./API_INTEGRATION.md) - How the frontend integrates with backend services, including API requests, authentication, and error handling.
- [Routing and Navigation](./ROUTING_NAVIGATION.md) - Explanation of the application's routing system, navigation patterns, and URL handling.

### Feature Documentation

- [PDF Handling and Viewer](./PDF_HANDLING.md) - Documentation of the PDF viewer implementation, security features, and content protection mechanisms.

### Deployment and Operations

- [Deployment Guide](./DEPLOYMENT.md) - Instructions for building, deploying, and maintaining the application across different environments.

## Project Overview

EbookAura is a full-stack web application for discovering, managing, and reading ebooks. The platform offers a user-friendly interface for browsing books, creating bookmarks, purchasing premium content with a virtual currency system, and downloading content.

### Key Features

- **User Authentication**
  - Secure login/registration with JWT
  - Email verification
  - Password recovery
  - Profile management

- **Book Management**
  - Browse catalog with filtering and sorting options
  - Advanced search functionality
  - Book details with ratings and reviews
  - Bookmark favorite books
  - Download PDF books

- **Premium Content**
  - Premium books with restricted access
  - Purchase system using virtual coins
  - User ownership tracking

- **Virtual Currency (Coins)**
  - Daily login rewards
  - Ad-watching rewards
  - Purchasing premium content
  - Transaction history

- **PDF Viewer and Content Protection**
  - Secure PDF viewing with canvas rendering
  - Page navigation and zoom controls
  - Reading progress tracking
  - Content protection for premium books
  - Watermarking

- **Responsive Design**
  - Mobile-friendly interface
  - Adaptive layout for all devices

## API Key Authentication System

EbookAura supports API key authentication for external applications and integrations:

- **API Key Generation**: Users can generate API keys from their account settings
- **API Key Management**: View, revoke, and regenerate API keys
- **Subscription Verification**: API keys are linked to user's subscription status
- **PDF Access**: Access protected PDF content via API keys

Example of accessing a PDF with an API key:

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

## Getting Started

To work with the EbookAura frontend codebase, follow these steps:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-organization/ebookaura.git
   cd ebookaura/ebooks-aura
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env.local` file with the necessary environment variables:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Access the application**:
   Open your browser and navigate to `http://localhost:3000`.

## Development Guidelines

When contributing to the EbookAura frontend, please follow these guidelines:

1. **Code Style**: Follow the established coding style and patterns used throughout the project.
2. **Component Structure**: Create new components according to the existing component organization.
3. **Documentation**: Update documentation when adding new features or making significant changes.
4. **Testing**: Write tests for new features and ensure all tests pass before submitting a pull request.
5. **Accessibility**: Ensure all UI components meet WCAG 2.1 AA standards.
6. **Performance**: Optimize for performance, especially for PDF rendering and large data sets.
7. **API Integration**: Follow the established patterns for API integration as described in [API Integration](./API_INTEGRATION.md).
8. **Security**: Implement proper authentication checks and content protection for premium features.
9. **Responsive Design**: Ensure all new components work across different device sizes.

## Technology Stack

EbookAura frontend is built with the following key technologies:

- **Next.js 14** - React framework for server-side rendering and static site generation
- **React 18** - UI library for building component-based interfaces
- **PDF.js** - PDF rendering engine with custom security enhancements
- **CSS Modules** - Scoped CSS styling
- **Material UI** - UI component library for consistent design
- **React Context API** - State management
- **SWR** - For data fetching and caching
- **React PDF Viewer** - Enhanced PDF viewing experience
- **React Icons** - Comprehensive icon library
- **React Toastify** - Toast notification system

## Project Structure

```
ebooks-aura/
├── public/                  # Static assets
│   ├── images/              # Image assets
│   ├── pdf-metadata/        # SEO metadata for PDFs
│   ├── sitemap.xml          # Generated sitemap
│   └── robots.txt           # Search engine directives
├── src/                     # Source code
│   ├── app/                 # Next.js App Router structure
│   │   ├── components/      # Reusable UI components
│   │   ├── api/             # API integration modules
│   │   ├── hooks/           # Custom React hooks
│   │   ├── utils/           # Utility functions
│   │   ├── context/         # React Context providers
│   │   ├── books/           # Book-related pages and components
│   │   │   └── [id]/        # Dynamic book pages
│   │   ├── search/          # Search functionality
│   │   ├── profile/         # User profile pages
│   │   ├── admin/           # Admin pages (protected)
│   │   ├── layout.js        # Root layout
│   │   └── page.js          # Home page
│   └── styles/              # Global styles
├── docs/                    # Documentation
├── scripts/                 # Utility scripts
├── next.config.mjs          # Next.js configuration
└── package.json             # Dependencies and scripts
```

## Backend Integration

The frontend communicates with the backend through a RESTful API. The backend provides:

- **Authentication services**: User registration, login, and profile management
- **Book services**: Book listing, search, and details
- **PDF services**: Secure PDF access and viewing
- **Premium content services**: Purchase and access management
- **Virtual currency services**: Coin management and rewards

For detailed information about the backend architecture, please refer to the backend documentation.

## Deployment Options

EbookAura supports multiple deployment strategies:

1. **Standard Next.js Deployment**
   - Server-side rendering capabilities
   - API route support
   - Dynamic content generation

2. **Static Site Export**
   - Pure static HTML/CSS/JS output
   - Can be hosted on any static file hosting
   - No server-side dependencies

For detailed deployment instructions, see the [Deployment Guide](./DEPLOYMENT.md).

## Security Considerations

EbookAura implements several security measures:

- **Authentication**: HTTP-only cookies for token storage
- **Content Protection**: Secure PDF viewing with canvas rendering
- **API Security**: Proper CORS configuration and API key authentication
- **Data Validation**: Input validation on both client and server
- **Content Security Policy**: Strict CSP headers to prevent XSS

## License

EbookAura is licensed under the MIT License.

```
MIT License

Copyright (c) 2025 YouthVibe

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Support and Contact

For questions, issues, or contributions:

- **Issue Tracker**: [GitHub Issues](https://github.com/your-organization/ebookaura/issues)
- **Documentation Updates**: Submit a pull request with documentation changes
- **Feature Requests**: Use the issue tracker with the "enhancement" label

## Future Enhancements

Planned improvements for future releases include:

- **Personalized Recommendations**: AI-based book recommendations
- **Reading Progress Tracking**: Sync reading progress across devices
- **Enhanced Social Features**: Sharing and community functionality
- **Dark Mode Support**: Comprehensive dark theme
- **Offline Support**: Progressive Web App (PWA) capabilities
- **Internationalization**: Multi-language support

---

*This documentation is maintained by the EbookAura development team.* 