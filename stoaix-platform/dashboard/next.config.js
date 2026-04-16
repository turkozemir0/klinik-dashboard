// @ts-check
const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'platform.stoaix.com'],
    },
  },
}

module.exports = withSentryConfig(nextConfig, {
  // Sentry webpack plugin options
  org: process.env.SENTRY_ORG ?? 'stoaix',
  project: process.env.SENTRY_PROJECT ?? 'platform-dashboard',
  // Source map'leri yükle (SENTRY_AUTH_TOKEN gerekli)
  silent: !process.env.CI,
  widenClientFileUpload: true,
  // Sentry'nin kendi telemetri verilerini gönderme
  telemetry: false,
  // Tree-shaking: sadece kullanılan Sentry modüllerini bundle'a dahil et
  disableLogger: true,
})
