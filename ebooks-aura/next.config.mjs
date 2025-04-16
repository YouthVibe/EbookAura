/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
      // Add a specific rule for PDF endpoints with query parameters
      {
        source: '/api/books/:id/pdf',
        destination: 'http://localhost:5000/api/books/:id/pdf',
        has: [
          {
            type: 'query',
            key: 'download',
            value: 'true',
          },
        ],
      },
      {
        source: '/api/books/:id/pdf',
        destination: 'http://localhost:5000/api/books/:id/pdf',
      },
    ];
  },
};

export default nextConfig;
