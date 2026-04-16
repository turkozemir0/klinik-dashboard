import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,          // prod'da %10 yeterli
  replaysOnErrorSampleRate: 1.0,  // hata olunca %100 replay
  replaysSessionSampleRate: 0.05, // normal oturum %5
  integrations: [Sentry.replayIntegration()],

  // KVKK uyumu: hassas verileri maskele
  beforeSend(event) {
    if (event.request?.data) {
      const sensitive = ['system_prompt', 'phone', 'email', 'access_token', 'pit_token', 'password']
      sensitive.forEach(key => {
        if (event.request?.data?.[key]) {
          event.request.data[key] = '[Filtered]'
        }
      })
    }
    // Kullanıcı email'ini maskele
    if (event.user?.email) {
      event.user.email = '[Filtered]'
    }
    return event
  },
})
