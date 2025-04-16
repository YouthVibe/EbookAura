# EbookAura Backend

This is the backend API for the EbookAura e-book management platform. It provides RESTful API endpoints for managing books, user authentication, and file uploads.

## Technology Stack

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - MongoDB ODM (Object Data Modeling)
- **JWT** - JSON Web Tokens for authentication
- **Cloudinary** - Cloud storage for books and images
- **Express-fileupload** - Middleware for handling file uploads

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user and get JWT token
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/forgot-password` - Request password reset
- `PUT /api/auth/reset-password/:resetToken` - Reset password with token

### Books

- `GET /api/books` - Get all books (with filters and pagination)
- `GET /api/books/:id` - Get a specific book by ID
- `GET /api/books/categories` - Get list of book categories
- `GET /api/books/tags` - Get list of book tags
- `GET /api/books/:id/pdf` - View or download a book PDF
- `GET /api/books/:id/pdf-content` - Get raw PDF content for download
- `POST /api/books/:id/download` - Increment download count for a book

### Reviews

- `GET /api/books/:bookId/reviews` - Get reviews for a book
- `GET /api/books/:bookId/rating` - Get average rating for a book
- `POST /api/books/:bookId/reviews` - Create a new review for a book

### Uploads (Admin Only)

- `POST /api/upload` - Upload an image file
- `POST /api/upload/pdf` - Upload a PDF book with metadata
- `DELETE /api/upload/:publicId` - Delete an uploaded file
- `DELETE /api/upload/book/:id` - Delete a book and its files

## Setup and Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file with the following variables:
   ```
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRE=30d
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   EMAIL_SERVICE=your_email_service
   EMAIL_USERNAME=your_email_username
   EMAIL_PASSWORD=your_email_password
   EMAIL_FROM=your_email_from_address
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Start the production server:
   ```
   npm start
   ```

## Data Models

### User Model
- Username, email, password, role (user/admin)
- Authentication tokens and reset password functionality

### Book Model
- Title, author, description, category, tags
- Cover image (URL and Cloudinary ID)
- PDF file (URL and Cloudinary ID)
- Metrics: views, downloads, average rating

### Review Model
- Book reference, user reference
- Rating, comment, creation date

## PDF Handling Features

- **Direct Upload to Cloudinary**: PDF books are uploaded directly to Cloudinary
- **Custom PDF Endpoints**: Specialized endpoints for viewing and downloading PDFs
- **Download Tracking**: The application keeps track of book downloads
- **Proper Content Headers**: Ensures PDFs are served with correct MIME types and content disposition

## Security

- Password encryption using bcrypt
- JWT token-based authentication
- Role-based access control for admin operations
- Secure file upload with size and type validation
- CORS configuration for API security

## Development

To contribute to the development:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request 

## Deployment

For detailed deployment instructions to Render.com, see the [RENDER-DEPLOYMENT.md](./RENDER-DEPLOYMENT.md) file.

### Common Deployment Issues

#### Case Sensitivity

When deploying to Linux-based environments like Render.com, be aware that the filesystem is case-sensitive, unlike Windows. This means `Book.js` and `book.js` are treated as different files. Always ensure your imports match the exact case of the file names:

```javascript
// This MUST match the actual filename case
const Book = require('../models/Book');
```

Run the included utility script to check for case-sensitivity issues before deployment:

```
npm run check-imports
```

#### Model Create vs Constructor Pattern

To ensure maximum compatibility, this project supports both Mongoose model patterns:

1. Static create method:
   ```javascript
   const book = await Book.create({...});
   ```

2. Constructor + save pattern:
   ```javascript
   const book = new Book({...});
   await book.save();
   ```

The codebase includes fallbacks to handle both methods where needed. 