# EbookAura Frontend Components

This document provides detailed information about the key components that make up the EbookAura frontend application.

## Page Components

Page components are the top-level components that correspond to URL routes in the application.

### Home Page (`/app/page.js`)

The landing page of the application displays:
- Featured books carousel
- Recently added books
- Popular books section
- Category browsing options

### Book Details Page (`/app/books/[id]/page.js`)

The individual book page that shows:
- Book cover and metadata
- Description and details
- PDF viewing and download options
- Review and rating system
- Related books

### Search Page (`/app/search/page.js`)

The book browsing and discovery page featuring:
- Search input with filters
- Category and tag filters
- Grid/list view options
- Pagination controls
- Sort options

### Login/Register Pages (`/app/login/page.js`, `/app/register/page.js`)

Authentication pages for user access:
- Login form with validation
- Registration form
- Password reset functionality
- OAuth integration (if implemented)

### Profile Pages (`/app/profile/page.js`)

User profile management:
- Personal information
- Reading history
- Bookmarks
- Purchased books
- Account settings

### Admin Pages (`/app/admin/page.js`)

Protected administrative pages:
- Book management dashboard
- User management
- Analytics and reports
- Settings management

## Core UI Components

### Navigation Components

#### Navbar (`/app/components/Navbar.js`)

The main navigation bar appears on all pages, providing:
- Site logo and branding
- Main navigation links
- Search box
- User menu (conditional based on authentication)
- Mobile-responsive design with hamburger menu

**Key Features:**
- Authentication-aware rendering
- Mobile responsiveness
- Active link highlighting
- Search integration

#### Footer

Site-wide footer component:
- Copyright information
- Navigation links
- Social media links
- Legal links (privacy policy, terms of service)

### Book-Related Components

#### BookPageClient (`/app/books/[id]/BookPageClient.js`)

Client-side component for book details rendering:
- Handles interactive elements of book display
- Manages state for PDF viewing
- Handles review submission
- Implements book purchasing functionality

**Key Features:**
- Dynamic content loading
- Interactive UI elements
- Authentication-aware actions
- Error handling and feedback

#### PdfViewer (`/app/components/PdfViewer.jsx`)

PDF viewing component with advanced features:
- Secure PDF loading from backend
- Page navigation
- Zoom controls
- Download option
- Progressive loading

**Implementation Details:**
```jsx
// Component accepts PDF URL and provides viewer interface
const PdfViewer = ({ pdfUrl, title }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  // Additional state and handlers...

  return (
    <div className={styles.pdfViewer}>
      {/* Viewer controls */}
      <div className={styles.controls}>
        <button onClick={prevPage} disabled={pageNumber <= 1}>Previous</button>
        <span>{pageNumber} / {numPages}</span>
        <button onClick={nextPage} disabled={pageNumber >= numPages}>Next</button>
        <button onClick={handleDownload}>Download</button>
      </div>
      
      {/* PDF Document viewer */}
      <Document
        file={pdfUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={<ProgressBar />}
        error={<div>Failed to load PDF</div>}
      >
        <Page pageNumber={pageNumber} />
      </Document>
    </div>
  );
};
```

#### BookReview (`/app/components/BookReview.js`)

Component for displaying and submitting book reviews:
- Star rating system
- Review text submission
- Review listing with pagination
- Owner-based edit/delete functionality

**Key Features:**
- Authentication-aware rendering
- Real-time validation
- Optimistic UI updates
- Error handling

### Form Components

#### SearchInput (`/app/components/SearchInput.js`)

Search input component with enhanced features:
- Instant search with debounce
- Search suggestions
- History tracking
- Clear button

**Implementation Details:**
```jsx
const SearchInput = ({ initialQuery, onSearch }) => {
  const [query, setQuery] = useState(initialQuery || '');
  const debouncedQuery = useDebounce(query, 300);
  
  useEffect(() => {
    if (debouncedQuery) {
      onSearch(debouncedQuery);
    }
  }, [debouncedQuery, onSearch]);
  
  return (
    <div className={styles.searchContainer}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for books..."
        className={styles.searchInput}
      />
      {query && (
        <button 
          className={styles.clearButton}
          onClick={() => setQuery('')}
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>
  );
};
```

#### AuthForms

Set of authentication-related form components:
- LoginForm
- RegisterForm
- PasswordResetForm

### UI Utility Components

#### Alert (`/app/components/Alert.js`)

Alert notification component for user feedback:
- Success/error/info/warning states
- Auto-dismiss functionality
- Custom styling
- Accessibility features

**Implementation:**
```jsx
const Alert = ({ message, type, onClose, autoClose = true }) => {
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);
  
  return (
    <div className={`${styles.alert} ${styles[type]}`} role="alert">
      <span className={styles.message}>{message}</span>
      <button className={styles.closeButton} onClick={onClose} aria-label="Close alert">
        ×
      </button>
    </div>
  );
};
```

#### ProgressBar (`/app/components/ProgressBar.js`)

Loading indicator component:
- Linear progress bar
- Circular spinner option
- Determinate/indeterminate modes
- Custom theming

#### AdComponent (`/app/components/AdComponent.js`)

Advertisement component for monetization:
- Responsive ad placement
- Different ad formats
- A/B testing capabilities
- Analytics integration

### Layout Components

#### PageLayout

Common page layout wrapper:
- Consistent page structure
- Header/footer inclusion
- Sidebar integration where needed
- Responsive behavior

## Context Providers

### Authentication Context

User authentication state management:
- Current user information
- Login/logout methods
- Authentication status
- Token management

**Implementation:**
```jsx
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const login = async (credentials) => {
    // Login implementation
  };
  
  const logout = async () => {
    // Logout implementation
  };
  
  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is authenticated
        // Set user if authenticated
      } catch (error) {
        // Handle error
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Theme Context

Application theming and appearance:
- Light/dark mode
- Color scheme preferences
- Font size settings
- Layout preferences

### Notification Context

System-wide notification management:
- Toast notifications
- Alerts
- Confirmation dialogs
- Error messages

## Specialized Components

### Admin Components

#### BookUploadForm

Form for administrators to upload new books:
- Book metadata input
- Cover image upload
- PDF file upload
- Category and tag selection
- Validation

#### UserManagement

Admin interface for user management:
- User listing with filters
- Role management
- Account status controls
- Activity monitoring

### User Account Components

#### ProfileSettings

User profile management interface:
- Personal information editing
- Password changing
- Email preferences
- Profile picture upload

#### LibraryView

User's book library component:
- Purchased books display
- Reading progress tracking
- Favorites organization
- History tracking

## HOCs (Higher-Order Components)

### withAuth

HOC that protects routes requiring authentication:
- Redirects unauthenticated users
- Role-based access control
- Loading state handling

**Implementation:**
```jsx
const withAuth = (Component, requiredRole = null) => {
  const WithAuth = (props) => {
    const { user, loading } = useAuth();
    const router = useRouter();
    
    useEffect(() => {
      if (!loading && !user) {
        router.push('/login?redirect=' + encodeURIComponent(router.asPath));
      } else if (requiredRole && user?.role !== requiredRole) {
        router.push('/unauthorized');
      }
    }, [user, loading, router]);
    
    if (loading) return <LoadingSpinner />;
    
    if (!user) return null;
    
    if (requiredRole && user.role !== requiredRole) return null;
    
    return <Component {...props} user={user} />;
  };
  
  return WithAuth;
};
```

### withErrorBoundary

HOC that adds error boundary functionality:
- Catches JavaScript errors
- Displays fallback UI
- Reports errors to monitoring service
- Provides recovery options

## Hooks

### Custom Hooks

#### useAuth

Hook for accessing authentication context:
- Current user
- Login/logout methods
- Authentication status checking

```jsx
const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

#### useBooks

Hook for book-related data fetching:
- Book listing
- Book details
- Search functionality
- Filtering and sorting

#### useForm

Hook for form state management:
- Form values
- Validation
- Submission handling
- Error management

## Component Styling

EbookAura uses CSS Modules for component styling, providing:

- Scoped CSS that avoids naming conflicts
- Component-specific styling
- Theme consistency through variables
- Responsive design with media queries

Example CSS Module (`BookReview.module.css`):
```css
.reviewContainer {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  background-color: var(--card-bg);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.reviewHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.rating {
  display: flex;
  color: var(--star-color);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .reviewContainer {
    padding: 0.75rem;
  }
}
```

## Component Communication Patterns

EbookAura components communicate through:

1. **Props**: Direct parent-to-child communication
2. **Context**: Application-wide state sharing
3. **Custom Events**: For complex component interaction
4. **URL Parameters**: For route-based state

## Accessibility Considerations

Components are built with accessibility in mind:

- Semantic HTML elements
- ARIA attributes where appropriate
- Keyboard navigation support
- Focus management
- Screen reader compatibility
- Color contrast compliance

## Component Testing

Components can be tested with:

- Unit tests for individual components
- Integration tests for component interaction
- End-to-end tests for complete user flows
- Accessibility testing

## Component Documentation Standards

Each component should be documented with:

- Purpose and functionality
- Props API with types and descriptions
- Usage examples
- Accessibility considerations
- Related components

This comprehensive component system creates a consistent, maintainable UI that delivers an excellent user experience for the EbookAura application. 