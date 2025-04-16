# EbookAura

EbookAura is a full-stack e-book management platform that allows users to explore, view, and download PDF e-books. The application provides a seamless reading experience with features for user authentication, book categorization, and personal libraries.

## Project Structure

The project consists of two main components:

- **Backend**: A Node.js/Express API that manages books, user authentication, and Cloudinary integration for PDF storage
- **Frontend**: A Next.js application that provides a modern, responsive UI for browsing and reading books

## Features

- 📚 Browse and search for books by title, author, category, or tags
- 👤 User authentication and profile management
- 📖 View PDF books directly in the browser
- 📥 Download books for offline reading
- ⭐ Rate and review books
- 📝 Admin dashboard for managing the book collection
- 📱 Responsive design for mobile and desktop

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Cloudinary account (for PDF and image storage)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/EbookAura.git
   cd EbookAura
   ```

2. Set up the backend:
   ```
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

3. Set up the frontend:
   ```
   cd ../ebooks-aura
   npm install
   npm run dev
   ```

## Deployment to Render.com

This project includes fixes for common deployment issues on case-sensitive file systems like Render.com:

1. Before deploying to Render.com, run:
   ```
   npm run pre-deploy
   ```

2. The deployment process includes automatic handling of case sensitivity issues with model files. A custom `prepareModels.js` script runs before the server starts to ensure all required model files are available regardless of case sensitivity.

3. When setting up on Render.com, use the following start command:
   ```
   npm start
   ```

## Environment Variables

The application requires several environment variables to be set up:

### Backend
- `PORT`: The port on which the server will run
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret for JWT token generation
- `JWT_EXPIRE`: JWT token expiration time
- `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Your Cloudinary API key
- `CLOUDINARY_API_SECRET`: Your Cloudinary API secret

### Frontend
- Set up in `.env.local` for the Next.js app
- API URLs are automatically managed by Next.js API routes

## Documentation

For detailed documentation about each component, please refer to:

- [Backend Documentation](./backend/README.md)
- [Frontend Documentation](./ebooks-aura/README.md)

## License

This project is licensed under the MIT License - see the LICENSE file for details. 