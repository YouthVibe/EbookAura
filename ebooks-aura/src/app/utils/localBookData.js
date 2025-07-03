// Utility for reading local book data
import fs from 'fs';
import path from 'path';

// Get absolute path to books.json
const booksJsonPath = path.join(process.cwd(), 'books.json');

/**
 * Get all books from local JSON file
 */
export function getAllBooks() {
  try {
    if (!fs.existsSync(booksJsonPath)) {
      console.error('books.json not found at:', booksJsonPath);
      return [];
    }
    const jsonData = fs.readFileSync(booksJsonPath, 'utf-8');
    return JSON.parse(jsonData);
  } catch (error) {
    console.error('Error reading books.json:', error);
    return [];
  }
}

/**
 * Get a specific book by ID from local JSON file
 */
export function getBookById(id) {
  try {
    if (!fs.existsSync(booksJsonPath)) {
      console.error('books.json not found at:', booksJsonPath);
      return null;
    }
    const jsonData = fs.readFileSync(booksJsonPath, 'utf-8');
    const books = JSON.parse(jsonData);
    return books.find(book => book._id === id || book.id === id);
  } catch (error) {
    console.error('Error reading books.json:', error);
    return null;
  }
}
