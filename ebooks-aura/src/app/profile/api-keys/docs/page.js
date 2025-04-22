'use client';

import { useState } from 'react';
import { Container, Typography, Box, Paper, Divider, Link as MuiLink, Accordion, AccordionSummary, AccordionDetails, Alert, Tabs, Tab, ButtonGroup, Button, useTheme } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import ArticleIcon from '@mui/icons-material/Article';
import CodeIcon from '@mui/icons-material/Code';
import SearchIcon from '@mui/icons-material/Search';
import JavaScriptIcon from '@mui/icons-material/Javascript';
import TerminalIcon from '@mui/icons-material/Terminal';
import LanguageIcon from '@mui/icons-material/Language';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import KeyIcon from '@mui/icons-material/Key';
import ApiIcon from '@mui/icons-material/Api';

// Change from hardcoded URL to environment variable with fallback
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ApiDocumentation() {
  const { user, loading: isLoading } = useAuth();
  const isAuthenticated = !!user;
  const router = useRouter();
  const theme = useTheme();
  
  // State for code example tabs
  const [languageTab, setLanguageTab] = useState(0);
  const [searchTab, setSearchTab] = useState(0);
  const [javascriptTab, setJavascriptTab] = useState(0);
  const [cliTab, setCliTab] = useState(0);
  const [pythonTab, setPythonTab] = useState(0);
  const [rubyTab, setRubyTab] = useState(0);
  
  const handleLanguageTabChange = (event, newValue) => {
    setLanguageTab(newValue);
  };
  
  const handleSearchTabChange = (event, newValue) => {
    setSearchTab(newValue);
  };
  
  const handleJavascriptTabChange = (event, newValue) => {
    setJavascriptTab(newValue);
  };
  
  const handleCliTabChange = (event, newValue) => {
    setCliTab(newValue);
  };
  
  const handlePythonTabChange = (event, newValue) => {
    setPythonTab(newValue);
  };
  
  const handleRubyTabChange = (event, newValue) => {
    setRubyTab(newValue);
  };
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/profile/api-keys/docs');
    }
  }, [isAuthenticated, isLoading, router]);
  
  if (isLoading) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
        <KeyOutlinedIcon fontSize="large" />
        <Typography variant="h4" component="h1">
          API Documentation
        </Typography>
      </Box>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Getting Started
        </Typography>
        <Typography paragraph>
          The EbookAura API allows you to programmatically interact with the platform to search books, 
          get book details, manage reviews, and more. To use the API, you'll need an API key which you can 
          create in your <Link href="/profile/api-keys" passHref><MuiLink>API Keys management page</MuiLink></Link>.
        </Typography>
        <Typography paragraph>
          All API requests require authentication using your API key. Add your key to all requests using the 
          <code style={{ backgroundColor: '#f5f5f5', padding: '2px 4px', borderRadius: '4px', margin: '0 4px' }}>X-API-Key</code> 
          header.
        </Typography>
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Base URL
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5', fontFamily: 'monospace' }}>
            <Typography>{API_BASE_URL}</Typography>
          </Paper>
        </Box>
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            API Key Authentication Examples
          </Typography>
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={languageTab} onChange={handleLanguageTabChange} aria-label="programming language examples">
              <Tab icon={<JavaScriptIcon />} label="Node.js" />
              <Tab icon={<LanguageIcon />} label="Browser" />
            </Tabs>
          </Box>
          
          {languageTab === 0 && (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5', fontFamily: 'monospace', overflowX: 'auto' }}>
              <pre>{`// Using Fetch API
fetch('${API_BASE_URL}/books', {
  headers: {
    'X-API-Key': 'your-api-key-here'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));

// Using Axios
axios.get('${API_BASE_URL}/books', {
  headers: {
    'X-API-Key': 'your-api-key-here'
  }
})
.then(response => console.log(response.data))
.catch(error => console.error('Error:', error));`}</pre>
            </Paper>
          )}
          
          {languageTab === 1 && (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5', fontFamily: 'monospace', overflowX: 'auto' }}>
              <pre>{`import requests

# Using requests
url = "${API_BASE_URL}/books"
headers = {"X-API-Key": "your-api-key-here"}

response = requests.get(url, headers=headers)
data = response.json()
print(data)

# Using with parameters
params = {
    "page": 1,
    "limit": 20,
    "search": "Python Programming"
}
response = requests.get(url, headers=headers, params=params)
search_results = response.json()
print(search_results)`}</pre>
            </Paper>
          )}
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              JavaScript Examples
            </Typography>
            
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs value={javascriptTab} onChange={handleJavascriptTabChange} aria-label="javascript examples">
                <Tab icon={<CodeIcon />} label="Fetch API" />
                <Tab icon={<ApiIcon />} label="SDK" />
              </Tabs>
            </Box>
            
            {javascriptTab === 0 && (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5', fontFamily: 'monospace', overflowX: 'auto' }}>
                <pre>{`// Configure your API key
const API_KEY = "your-api-key-here";
const BASE_URL = "${API_BASE_URL}";

// Function to fetch books
async function getBooks() {
  const response = await fetch(\`\${BASE_URL}/books\`, {
    method: 'GET',
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(\`HTTP error! status: \${response.status}\`);
  }
  
  const data = await response.json();
  return data;
}

// Function to search books
async function searchBooks(query, page = 1, limit = 20) {
  const params = new URLSearchParams({
    search: query,
    page: page.toString(),
    limit: limit.toString()
  });
  
  const response = await fetch(\`\${BASE_URL}/books?\${params}\`, {
    method: 'GET',
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(\`HTTP error! status: \${response.status}\`);
  }
  
  const data = await response.json();
  return data;
}`}</pre>
              </Paper>
            )}
            
            {javascriptTab === 1 && (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5', fontFamily: 'monospace', overflowX: 'auto' }}>
                <pre>{`// Import the SDK
import { EbookAuraClient } from 'ebookaura-js';

// Initialize the client with your API key
const client = new EbookAuraClient({
  apiKey: 'your-api-key-here'
});

// Get all books
client.books.list()
  .then(books => console.log(books))
  .catch(error => console.error(error));

// Search for books
client.books.search('javascript', { page: 1, limit: 20 })
  .then(results => console.log(results))
  .catch(error => console.error(error));

// Get book details
client.books.get('book-id-here')
  .then(book => console.log(book))
  .catch(error => console.error(error));

// Add a review
client.books.addReview({
  bookId: 'book-id-here',
  rating: 5,
  comment: 'Excellent resource for learning!'
})
  .then(review => console.log('Review added:', review))
  .catch(error => console.error(error));`}</pre>
              </Paper>
            )}
          </Box>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              CLI Examples
            </Typography>
            
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs value={cliTab} onChange={handleCliTabChange} aria-label="cli examples">
                <Tab icon={<TerminalIcon />} label="Basic Usage" />
                <Tab icon={<KeyIcon />} label="Authentication" />
              </Tabs>
            </Box>
            
            {cliTab === 0 && (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5', fontFamily: 'monospace', overflowX: 'auto' }}>
                <pre>{`# Basic CLI commands
ebookaura list              # List all books
ebookaura search "fantasy"  # Search for books by term
ebookaura info <book-id>    # Get detailed info about a book`}</pre>
              </Paper>
            )}
            
            {cliTab === 1 && (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5', fontFamily: 'monospace', overflowX: 'auto' }}>
                <pre>{`# Setting up authentication
ebookaura configure            # Interactive setup
ebookaura set-key <your-key>   # Set API key directly

# Using with commands
ebookaura --key=<your-key> list    # Use key for this command only
# Or set EBOOKAURA_API_KEY environment variable`}</pre>
              </Paper>
            )}
          </Box>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Python Examples
            </Typography>
            
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs value={pythonTab} onChange={handlePythonTabChange} aria-label="python examples">
                <Tab icon={<CodeIcon />} label="Requests" />
                <Tab icon={<ApiIcon />} label="SDK" />
              </Tabs>
            </Box>
            
            {pythonTab === 0 && (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5', fontFamily: 'monospace', overflowX: 'auto' }}>
                <pre>{`import requests

# Configuration
API_KEY = "your-api-key-here"
BASE_URL = "${API_BASE_URL}"
headers = {"X-API-Key": API_KEY}

# Get books
response = requests.get(f"{BASE_URL}/books", headers=headers)
books = response.json()
print(books)

# Search books
params = {"search": "python", "page": 1, "limit": 20}
response = requests.get(f"{BASE_URL}/books", headers=headers, params=params)
search_results = response.json()
print(search_results)`}</pre>
              </Paper>
            )}
            
            {pythonTab === 1 && (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5', fontFamily: 'monospace', overflowX: 'auto' }}>
                <pre>{`from ebookaura import Client

# Initialize client with your API key
client = Client(api_key="your-api-key-here")

# Get all books
books = client.books.list()

# Search for books
search_results = client.books.search("python", page=1, limit=20)

# Get book details
book = client.books.get("book-id-here")

# Post a review
review = client.books.add_review(
    book_id="book-id-here",
    rating=5,
    comment="Great book!"
)`}</pre>
              </Paper>
            )}
          </Box>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Ruby Examples
            </Typography>
            
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs value={rubyTab} onChange={handleRubyTabChange} aria-label="ruby examples">
                <Tab icon={<CodeIcon />} label="Net::HTTP" />
                <Tab icon={<ApiIcon />} label="SDK" />
              </Tabs>
            </Box>
            
            {rubyTab === 0 && (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5', fontFamily: 'monospace', overflowX: 'auto' }}>
                <pre>{`# Using Net::HTTP
require 'net/http'
require 'uri'
require 'json'

API_KEY = 'your-api-key-here'
BASE_URL = '${API_BASE_URL}'

# Function to fetch books
def get_books
  uri = URI.parse("\#{BASE_URL}/books")
  request = Net::HTTP::Get.new(uri)
  request['X-API-Key'] = API_KEY
  request['Content-Type'] = 'application/json'
  
  response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == 'https') do |http|
    http.request(request)
  end
  
  if response.code.to_i >= 200 && response.code.to_i < 300
    JSON.parse(response.body)
  else
    raise "HTTP Error: \#{response.code} \#{response.message}"
  end
end

# Function to search books
def search_books(query, page = 1, limit = 20)
  uri = URI.parse("\#{BASE_URL}/books")
  uri.query = URI.encode_www_form({
    search: query,
    page: page,
    limit: limit
  })
  
  request = Net::HTTP::Get.new(uri)
  request['X-API-Key'] = API_KEY
  request['Content-Type'] = 'application/json'
  
  response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == 'https') do |http|
    http.request(request)
  end
  
  if response.code.to_i >= 200 && response.code.to_i < 300
    JSON.parse(response.body)
  else
    raise "HTTP Error: \#{response.code} \#{response.message}"
  end
end`}</pre>
              </Paper>
            )}
            
            {rubyTab === 1 && (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5', fontFamily: 'monospace', overflowX: 'auto' }}>
                <pre>{`# Install the gem: gem install ebookaura
require 'ebookaura'

# Initialize the client with your API key
client = EbookAura::Client.new(api_key: 'your-api-key-here')

# Get all books
books = client.books.list
puts books

# Search for books
results = client.books.search('ruby programming', page: 1, limit: 20)
puts results

# Get book details
book = client.books.get('book-id-here')
puts book

# Add a review
review = client.books.add_review(
  book_id: 'book-id-here',
  rating: 5,
  comment: 'Excellent resource for Ruby programmers!'
)
puts "Review added: \#{review}"`}</pre>
              </Paper>
            )}
          </Box>
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SearchIcon fontSize="medium" />
          Search Functionality
        </Typography>
        
        <Typography paragraph>
          EbookAura provides a powerful search API that allows you to find books based on various criteria.
          The search endpoint supports pagination, filtering by categories/tags, and full-text search.
        </Typography>
        
        <Box sx={{ mb: 4 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={searchTab} onChange={handleSearchTabChange} aria-label="search functionality examples">
              <Tab icon={<SearchIcon />} label="Basic Search" />
              <Tab icon={<CodeIcon />} label="Advanced Search" />
              <Tab icon={<ArticleIcon />} label="Response Format" />
            </Tabs>
          </Box>
        </Box>
        
        {searchTab === 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Basic Text Search
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5', fontFamily: 'monospace' }}>
              <Typography color="primary">GET /books?search=python programming</Typography>
            </Paper>
            <Typography paragraph>
              The search parameter performs a text search across book titles, authors, descriptions, and tags.
              It's case-insensitive and supports partial matches.
            </Typography>
          </Box>
        )}
        
        {searchTab === 1 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Filtered Search
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5', fontFamily: 'monospace' }}>
              <Typography color="primary">GET /books?category=programming&tags=python,beginner&page=2&limit=10</Typography>
            </Paper>
            <Typography paragraph>
              You can combine multiple parameters for more precise results:
            </Typography>
            <ul>
              <li><Typography><code>category</code> - Exact match on book category</Typography></li>
              <li><Typography><code>tags</code> - Comma-separated list of tags to match</Typography></li>
              <li><Typography><code>search</code> - Text search across multiple fields</Typography></li>
              <li><Typography><code>page</code> & <code>limit</code> - Control pagination</Typography></li>
            </ul>
          </Box>
        )}
        
        {searchTab === 2 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Response Format
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5', fontFamily: 'monospace', overflowX: 'auto' }}>
              <pre>{`{
  "books": [
    {
      "id": "507f1f77bcf86cd799439011",
      "title": "Python Programming for Beginners",
      "author": "John Smith",
      "description": "A comprehensive guide to Python programming...",
      "coverUrl": "https://example.com/covers/python-book.jpg",
      "category": "Programming",
      "tags": ["python", "beginner", "programming"],
      "rating": 4.5,
      "reviewCount": 42
    },
    // More books...
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "totalBooks": 48
  }
}`}</pre>
            </Paper>
            <Typography paragraph>
              The response includes the list of books and pagination information for implementing
              pagination controls in your application.
            </Typography>
          </Box>
        )}
      </Paper>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Rate Limits
        </Typography>
        <Typography paragraph>
          To ensure fair usage of the API, the following rate limits apply per API key:
        </Typography>
        <ul>
          <li>
            <Typography paragraph>
              <strong>Book Searches:</strong> 50 requests per day
            </Typography>
          </li>
          <li>
            <Typography paragraph>
              <strong>Review Posts:</strong> 10 requests per day
            </Typography>
          </li>
        </ul>
        <Typography paragraph>
          Rate limits reset at midnight UTC. If you exceed the rate limit, the API will return a 429 Too Many Requests response with details about your usage and reset time.
        </Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="subtitle2">Rate Limit Response Example:</Typography>
          <Box component="pre" sx={{ 
            bgcolor: '#f5f5f5', 
            p: 1, 
            borderRadius: 1, 
            fontSize: '0.8rem',
            overflowX: 'auto' 
          }}>
            {`{
  "message": "Daily book search limit reached",
  "code": "RATE_LIMIT_EXCEEDED",
  "limit": 50,
  "used": 50,
  "reset": "2023-04-21T00:00:00.000Z",
  "resetIn": "8 hours"
}`}
          </Box>
        </Alert>
      </Paper>
      
      <Typography variant="h5" component="h2" gutterBottom>
        API Endpoints
      </Typography>
      
      {/* Books Endpoints */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ArticleIcon />
            <Typography variant="h6">Books</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Get All Books
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5', fontFamily: 'monospace' }}>
            <Typography color="primary">GET /books</Typography>
          </Paper>
          <Typography paragraph>
            Returns a list of books with pagination support.
          </Typography>
          <Typography variant="subtitle2" gutterBottom>
            Query Parameters:
          </Typography>
          <ul>
            <li><Typography><code>page</code> - Page number (default: 1)</Typography></li>
            <li><Typography><code>limit</code> - Number of books per page (default: 12)</Typography></li>
            <li><Typography><code>search</code> - Search term for book title/author</Typography></li>
            <li><Typography><code>category</code> - Filter by category</Typography></li>
            <li><Typography><code>tags</code> - Filter by tags (comma-separated)</Typography></li>
          </ul>
          
          <Alert severity="success" sx={{ mt: 1, mb: 3 }}>
            <Typography variant="body2">
              <strong>Example:</strong> <code>{`${API_BASE_URL}/books?search=python&category=programming&page=2&limit=20`}</code>
            </Typography>
          </Alert>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Get Book Details
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5', fontFamily: 'monospace' }}>
            <Typography color="primary">GET /books/:id</Typography>
          </Paper>
          <Typography paragraph>
            Returns detailed information about a specific book.
          </Typography>
          
          <Alert severity="success" sx={{ mt: 1, mb: 3 }}>
            <Typography variant="body2">
              <strong>Example:</strong> <code>{`${API_BASE_URL}/books/6450b932c25ccda6a7f59f2b`}</code>
            </Typography>
          </Alert>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Get Book Categories
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5', fontFamily: 'monospace' }}>
            <Typography color="primary">GET /books/categories</Typography>
          </Paper>
          <Typography paragraph>
            Returns a list of all book categories.
          </Typography>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Get Book Tags
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5', fontFamily: 'monospace' }}>
            <Typography color="primary">GET /books/tags</Typography>
          </Paper>
          <Typography paragraph>
            Returns a list of all book tags.
          </Typography>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Get PDF Content
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5', fontFamily: 'monospace' }}>
            <Typography color="primary">GET /books/:id/pdf-content</Typography>
          </Paper>
          <Typography paragraph>
            Returns the PDF content of a book. Requires the <code>getPdf</code> permission.
          </Typography>
        </AccordionDetails>
      </Accordion>
      
      {/* Reviews Endpoints */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ArticleIcon />
            <Typography variant="h6">Reviews</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Get Book Reviews
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5', fontFamily: 'monospace' }}>
            <Typography color="primary">GET /books/:bookId/reviews</Typography>
          </Paper>
          <Typography paragraph>
            Returns a list of reviews for a specific book.
          </Typography>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Create Book Review
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5', fontFamily: 'monospace' }}>
            <Typography color="primary">POST /books/:bookId/reviews</Typography>
          </Paper>
          <Typography paragraph>
            Creates a new review for a book. Requires the <code>postReviews</code> permission.
          </Typography>
          <Typography variant="subtitle2" gutterBottom>
            Request Body:
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5', fontFamily: 'monospace', overflowX: 'auto' }}>
            <pre>{`{
  "rating": 5,        // Rating (1-5)
  "comment": "Great book! Highly recommended."
}`}</pre>
          </Paper>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Get Book Rating
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5', fontFamily: 'monospace' }}>
            <Typography color="primary">GET /books/:bookId/rating</Typography>
          </Paper>
          <Typography paragraph>
            Returns the average rating and review count for a book.
          </Typography>
        </AccordionDetails>
      </Accordion>
      
      {/* User Endpoints */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ArticleIcon />
            <Typography variant="h6">User</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Get User Profile
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5', fontFamily: 'monospace' }}>
            <Typography color="primary">GET /users/profile</Typography>
          </Paper>
          <Typography paragraph>
            Returns the profile information for the authenticated user.
          </Typography>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Update User Profile
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5', fontFamily: 'monospace' }}>
            <Typography color="primary">PUT /users/profile</Typography>
          </Paper>
          <Typography paragraph>
            Updates the user profile. Requires the <code>write</code> permission.
          </Typography>
          <Typography variant="subtitle2" gutterBottom>
            Request Body:
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5', fontFamily: 'monospace', overflowX: 'auto' }}>
            <pre>{`{
  "fullName": "John Doe",
  "bio": "Book enthusiast and avid reader."
}`}</pre>
          </Paper>
        </AccordionDetails>
      </Accordion>
      
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Link href="/profile/api-keys" passHref>
          <MuiLink sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            <KeyOutlinedIcon fontSize="small" />
            Back to API Keys Management
          </MuiLink>
        </Link>
      </Box>
    </Container>
  );
} 