/**
 * Utility for fetching data from local files instead of API during static generation
 */
import { getBookById, getAllBooks } from './localBookData';
import { API_ENDPOINTS } from './config';

// Check if we're in static export mode
const isStaticBuild = process.env.STATIC_EXPORT === 'true';

/**
 * Wrapper for fetch operations that uses local data during static generation
 */
export async function localAwareFetch(url, options = {}) {
  // If we're not in static export mode, use the normal fetch
  if (!isStaticBuild) {
    return fetch(url, options);
  }

  // Handle book detail requests
  const bookDetailMatch = url.match(/\/books\/([a-z0-9]+)$/i);
  if (bookDetailMatch) {
    const bookId = bookDetailMatch[1];
    const book = getBookById(bookId);
    if (!book) {
      return {
        ok: false,
        status: 404,
        json: async () => ({ message: 'Book not found' })
      };
    }
    return {
      ok: true,
      status: 200,
      json: async () => book
    };
  }

  // Handle book list requests
  if (url.match(/\/books(\?|$)/)) {
    const books = getAllBooks();
    return {
      ok: true,
      status: 200,
      json: async () => books
    };
  }

  // For all other requests, use the normal fetch
  return fetch(url, options);
}
