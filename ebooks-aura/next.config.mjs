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
    
    // Important: When using static export, we need to make sure our book pages
    // can still be generated dynamically. Individual book pages should be 
    // rendered on the client-side when not pre-rendered at build time.
    // The 'dynamic' and 'revalidate' exports in the book page component 
    // enable this functionality.
    
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
