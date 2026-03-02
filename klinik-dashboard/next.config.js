/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'panel.stoaix.com',
        '.vercel.app',
      ],
    },
  },
};

module.exports = nextConfig;
