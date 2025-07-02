/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === 'production';

const nextConfig = {
  // Common configuration for both environments
  images: {
    domains: ['res.cloudinary.com'],
    ...(isProduction && { unoptimized: true }), // Only unoptimize images in production for static export
  },
  webpack: (config) => {
    // Handle PDF.js worker
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

  // Production-specific configuration
  ...(isProduction && {
    output: 'standalone',
    cssModules: true,
    eslint: {
      ignoreDuringBuilds: true,
    },
    typescript: {
      ignoreBuildErrors: true,
    },
    trailingSlash: true,
  }),

  // Development-specific configuration
  ...(!isProduction && {
    async rewrites() {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      return [
        {
          source: '/api/:path*',
          destination: `${apiBaseUrl}/:path*`,
        },
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