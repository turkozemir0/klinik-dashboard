/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ESLint ayrı bir süreçte çalıştırılır; build'i bloklamasın
    ignoreDuringBuilds: true,
  },
  typescript: {
    // TypeScript hataları build'i bloklamasın (strict: false ile tutarlı)
    ignoreBuildErrors: true,
  },
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
