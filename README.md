# EbookAura

EbookAura is a full-stack web application for discovering, managing, and reading ebooks. The platform offers a user-friendly interface for browsing books, creating bookmarks, and downloading content.

## Project Structure

This repository contains both the frontend and backend components of the EbookAura application:

- **frontend (ebooks-aura/)**: Next.js application with React components
- **backend/**: Express.js REST API connected to MongoDB

## Getting Started

### Prerequisites

- Node.js (v14.x or higher)
- MongoDB (local instance or MongoDB Atlas account)
- Cloudinary account (for file storage)

### Setting Up the Backend

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=5000
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

4. Start the server:
   - **Windows**: Run the batch file
     ```
     start-server.bat
     ```
   - **Unix/Mac**: 
     ```
     node start-server.js
     ```

The backend server will start on http://localhost:5000 (or the port specified in your .env file).

### Setting Up the Frontend

1. Navigate to the frontend directory:
   ```
   cd ebooks-aura
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the frontend directory with:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

4. Run the development server:
   ```
   npm run dev
   ```

The frontend will be available at http://localhost:3000.

### Building for Production

#### Static Site Generation

To build a static version of the frontend:

1. Navigate to the frontend directory:
   ```
   cd ebooks-aura
   ```

2. Create a `.env` file with:
   ```
   NEXT_PUBLIC_API_URL=https://ebookaura.onrender.com/api
   STATIC_EXPORT=true
   ```

3. Run the build command:
   ```
   npx next build
   ```

4. The static site will be generated in the `out` directory.

#### Windows Users

Windows users can use the provided batch file to simplify the static build process:

```
cd ebooks-aura
build-static-windows.bat
```

## Available Scripts

### Backend

- `npm start`: Start the server
- `npm run dev`: Start the server with nodemon for development

### Frontend

- `npm run dev`: Start the development server
- `npm run build`: Build the application for production
- `npm start`: Start the production server
- `npm run lint`: Run ESLint to check code quality

## API Endpoints

The backend provides the following API endpoints:

- **Authentication**
  - `POST /api/auth/register`: Register a new user
  - `POST /api/auth/login`: Log in an existing user
  - `GET /api/auth/profile`: Get the current user's profile

- **Books**
  - `GET /api/books`: Get all books
  - `GET /api/books/:id`: Get a specific book
  - `POST /api/books`: Add a new book (admin only)
  - `PUT /api/books/:id`: Update a book (admin only)
  - `DELETE /api/books/:id`: Delete a book (admin only)

- **Bookmarks**
  - `GET /api/users/bookmarks`: Get the current user's bookmarks
  - `POST /api/users/bookmarks/:bookId`: Add a bookmark
  - `DELETE /api/users/bookmarks/:bookId`: Remove a bookmark

- **File Upload**
  - `POST /api/upload/image`: Upload an image
  - `POST /api/upload/pdf`: Upload a PDF file
  - `DELETE /api/upload/:id`: Delete a file

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License. 