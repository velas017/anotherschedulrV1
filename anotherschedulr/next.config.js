// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
      // Public environment variables for client-side debugging
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      BASE_DOMAIN: process.env.BASE_DOMAIN || 'schedulr.app',
      // Note: Only expose non-sensitive variables to the client
    },
    // Enable experimental features for subdomain support
    experimental: {
      // Add any valid experimental features here if needed
    },
    // Custom rewrites for subdomain handling (for development)
    async rewrites() {
      return [
        // Rewrite subdomain.localhost:3000 to /book/subdomain in development
        {
          source: '/',
          destination: '/book/:subdomain',
          has: [
            {
              type: 'host',
              value: '(?<subdomain>.*)\\.localhost:3000',
            },
          ],
        },
      ];
    },
    // Custom headers for subdomain support
    async headers() {
      return [
        {
          source: '/book/:path*',
          headers: [
            {
              key: 'X-Frame-Options',
              value: 'SAMEORIGIN', // Allow iframe embedding for booking pages
            },
            {
              key: 'Access-Control-Allow-Origin',
              value: '*', // Allow cross-origin requests for subdomain booking
            },
          ],
        },
      ];
    },
    webpack: (config, { isServer }) => {
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
        };
      }
  
      return config;
    },
  };
  
  module.exports = nextConfig;
  