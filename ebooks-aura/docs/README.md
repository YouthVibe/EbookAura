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

## Getting Started

To work with the EbookAura frontend codebase, follow these steps:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-organization/ebooks-aura.git
   cd ebooks-aura
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env.local` file with the necessary environment variables as described in the [Deployment Guide](./DEPLOYMENT.md).

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

## Technology Stack

EbookAura frontend is built with the following key technologies:

- **Next.js** - React framework for server-side rendering and static site generation
- **React** - UI library for building component-based interfaces
- **PDF.js** - PDF rendering engine
- **CSS Modules** - Scoped CSS styling
- **Material UI** - UI component library
- **React Context API** - State management

## Project Structure

```
ebooks-aura/
├── public/              # Static assets
├── src/                 # Source code
│   ├── app/             # Next.js App Router structure
│   │   ├── components/  # Reusable UI components
│   │   ├── api/         # API integration modules
│   │   ├── hooks/       # Custom React hooks
│   │   ├── utils/       # Utility functions
│   │   ├── context/     # React Context providers
│   │   ├── books/       # Book-related pages and components
│   │   ├── layout.js    # Root layout
│   │   └── page.js      # Home page
│   └── styles/          # Global styles
├── docs/                # Documentation
├── scripts/             # Utility scripts
├── next.config.mjs      # Next.js configuration
└── package.json         # Dependencies and scripts
```

## Support and Contact

For questions, issues, or contributions:

- **Issue Tracker**: [GitHub Issues](https://github.com/your-organization/ebooks-aura/issues)
- **Documentation Updates**: Submit a pull request with documentation changes
- **Feature Requests**: Use the issue tracker with the "enhancement" label

---

*This documentation is maintained by the EbookAura development team.* 