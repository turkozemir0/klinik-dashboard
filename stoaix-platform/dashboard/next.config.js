/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'platform.stoaix.com'],
    },
  },
}

module.exports = nextConfig
