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
    webpack: (config) => {
      // Handle PDFjs worker
      config.resolve.alias.canvas = false;
      config.resolve.alias.encoding = false;
      
      // Add specific rules for PDF.js worker files
      config.module.rules.push({
        test: /pdf\.worker\.(min\.)?js/,
        type: 'asset/resource',
        generator: {
          filename: 'static/chunks/[name].[hash][ext]',
        },
      });
      
      return config;
    },
  } : {
    // Development configuration
    images: {
      domains: ['res.cloudinary.com'],
    },
    webpack: (config) => {
      // Handle PDFjs worker
      config.resolve.alias.canvas = false;
      config.resolve.alias.encoding = false;
      
      // Add specific rules for PDF.js worker files
      config.module.rules.push({
        test: /pdf\.worker\.(min\.)?js/,
        type: 'asset/resource',
        generator: {
          filename: 'static/chunks/[name].[hash][ext]',
        },
      });
      
      return config;
    },
    async rewrites() {
      // Use the API URL from environment variable or fallback to localhost
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      
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
