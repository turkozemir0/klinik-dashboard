import Stripe from 'stripe'

// Lazy getter — module-level init yok (Vercel build safe)
export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY env var eksik')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-03-25.dahlia',
  })
}

// Plan ID → Stripe Price ID mapping (env var'lardan okunur)
export function getPriceId(planId: string, interval: 'monthly' | 'annual'): string | null {
  const map: Record<string, Record<string, string | undefined>> = {
    lite:     { monthly: process.env.STRIPE_PRICE_LITE_MONTHLY,     annual: process.env.STRIPE_PRICE_LITE_ANNUAL },
    plus:     { monthly: process.env.STRIPE_PRICE_PLUS_MONTHLY,     annual: process.env.STRIPE_PRICE_PLUS_ANNUAL },
    advanced: { monthly: process.env.STRIPE_PRICE_ADVANCED_MONTHLY, annual: process.env.STRIPE_PRICE_ADVANCED_ANNUAL },
    agency:   { monthly: process.env.STRIPE_PRICE_AGENCY_MONTHLY,   annual: process.env.STRIPE_PRICE_AGENCY_ANNUAL },
  }
  return map[planId]?.[interval] ?? null
}
