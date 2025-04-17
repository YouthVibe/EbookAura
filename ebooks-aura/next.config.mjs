/** @type {import('next').NextConfig} */
const nextConfig = {
  // Conditional configuration based on environment
  ...(process.env.STATIC_EXPORT === 'true' ? {
    // Static export configuration
    output: 'export',
    images: {
      domains: ['res.cloudinary.com'],
      unoptimized: true, // Required for static export
    },
    // Static exports don't support rewrites
    // Disable linting and type checking for faster builds
    eslint: {
      ignoreDuringBuilds: true,
    },
    typescript: {
      ignoreBuildErrors: true,
    },
    trailingSlash: true,
  } : {
    // Development configuration
    images: {
      domains: ['res.cloudinary.com'],
    },
    async rewrites() {
      // Always use production API URL
      const apiBaseUrl = 'https://ebookaura.onrender.com/api';
      
      return [
        {
          source: '/api/:path*',
          destination: `${apiBaseUrl}/:path*`,
        },
        // Add a specific rule for PDF endpoints with query parameters
        {
          source: '/api/books/:id/pdf',
          destination: `${apiBaseUrl}/books/:id/pdf`,
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
          destination: `${apiBaseUrl}/books/:id/pdf`,
        },
      ];
    },
  }),
};

export default nextConfig;
