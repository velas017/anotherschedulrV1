// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
      // Public environment variables for client-side debugging
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      // Note: Only expose non-sensitive variables to the client
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
  