import { NextResponse } from 'next/server';

// List of social media bot user agents
const SOCIAL_BOT_PATTERNS = [
  'facebookexternalhit',
  'twitterbot',
  'whatsapp',
  'instagram',
  'linkedinbot',
  'pinterest',
  'slackbot',
  'telegram',
  'discordbot',
  'vkshare',
  'whatsbot',
  'linebot',
  'wechat',
  'viber',
  'mastodon',
  'snapchat'
];

export function middleware(request) {
  // Get the user agent
  const userAgent = request.headers.get('user-agent') || '';
  
  // Check if it's a social media bot
  const isSocialBot = SOCIAL_BOT_PATTERNS.some(pattern => 
    userAgent.toLowerCase().includes(pattern.toLowerCase())
  );
  
  // Clone the response
  const response = NextResponse.next();
  
  // Add a custom header to indicate if this is a social bot
  // This can be used in your pages to provide enhanced metadata
  response.headers.set('x-is-social-bot', isSocialBot ? 'true' : 'false');
  
  // If it's a book page and a social bot, ensure we have proper book metadata
  if (isSocialBot && request.nextUrl.pathname.startsWith('/books/')) {
    // Extract the book ID from the URL
    const bookId = request.nextUrl.pathname.split('/')[2];
    
    if (bookId) {
      // Set a header with the book ID for use in the page
      response.headers.set('x-book-id', bookId);
    }
  }
  
  return response;
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (e.g. robots.txt, images, etc.)
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|api/).*)',
  ],
}; 