import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { getStripe } from '@/lib/stripe'

function getServiceClient() {
  return createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

const ADDON_CATALOG: Record<string, {
  name: string
  priceEnvKey: string
  bonusAmount: number
  featureKey: string
  expiresWithPeriod?: boolean
  mode?: 'payment' | 'subscription'
  isService?: boolean
}> = {
  // --- Kredi Paketleri ---
  voice_100: { name: 'Ses Paketi (+100 dk)', priceEnvKey: 'STRIPE_PRICE_VOICE_100', bonusAmount: 100, featureKey: 'voice_agent_inbound', expiresWithPeriod: true },
  voice_200: { name: 'Ses Paketi (+200 dk)', priceEnvKey: 'STRIPE_PRICE_VOICE_200', bonusAmount: 200, featureKey: 'voice_agent_inbound', expiresWithPeriod: true },
  voice_500: { name: 'Ses Paketi (+500 dk)', priceEnvKey: 'STRIPE_PRICE_VOICE_500', bonusAmount: 500, featureKey: 'voice_agent_inbound', expiresWithPeriod: true },
  conv_500:  { name: 'Konuşma Paketi (+500)', priceEnvKey: 'STRIPE_PRICE_CONV_500', bonusAmount: 500, featureKey: 'ai_conversations', expiresWithPeriod: true },
  conv_1000: { name: 'Konuşma Paketi (+1.000)', priceEnvKey: 'STRIPE_PRICE_CONV_1000', bonusAmount: 1000, featureKey: 'ai_conversations', expiresWithPeriod: true },
  // --- Reactivation (güncellendi: $29.99 / 5K) ---
  reactivation: { name: 'Lead Reactivation (+5.000)', priceEnvKey: 'STRIPE_PRICE_REACTIVATION_ONETIME', bonusAmount: 5000, featureKey: 'workflow_reactivation' },
  // --- Setup & Onboarding ---
  setup_onboarding: { name: 'Setup & Onboarding (1:1)', priceEnvKey: 'STRIPE_PRICE_SETUP_ONETIME', bonusAmount: 0, featureKey: '', isService: true },
  // --- Dedicated Support (subscription) ---
  support_monthly: { name: 'Dedicated Support', priceEnvKey: 'STRIPE_PRICE_SUPPORT_MONTHLY', bonusAmount: 1, featureKey: 'dedicated_support', mode: 'subscription' },
}

// POST /api/billing/addon
// Body: { addon_id: "reactivation" }
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = getServiceClient()
  const { data: orgUser } = await service
    .from('org_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!orgUser) return NextResponse.json({ error: 'Org bulunamadı' }, { status: 403 })

  const orgId = orgUser.organization_id
  const body = await req.json()
  const { addon_id } = body as { addon_id: string }

  const addon = ADDON_CATALOG[addon_id]
  if (!addon) {
    return NextResponse.json({ error: 'Geçersiz addon' }, { status: 400 })
  }

  const priceId = process.env[addon.priceEnvKey]
  if (!priceId) {
    return NextResponse.json({ error: 'Addon fiyatı henüz yapılandırılmadı' }, { status: 400 })
  }

  // Stripe customer — mevcut subscription'dan al veya yeni oluştur
  const { data: sub } = await service
    .from('org_subscriptions')
    .select('stripe_customer_id')
    .eq('organization_id', orgId)
    .maybeSingle()

  const stripe = getStripe()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://platform.stoaix.com'

  let customerId = sub?.stripe_customer_id
  if (!customerId) {
    const { data: org } = await service
      .from('organizations')
      .select('name')
      .eq('id', orgId)
      .single()

    const customer = await stripe.customers.create({
      email: user.email,
      name: org?.name ?? undefined,
      metadata: { organization_id: orgId },
    })
    customerId = customer.id
  }

  const mode = addon.mode ?? 'payment'

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/settings?tab=billing&addon=success`,
    cancel_url: `${appUrl}/dashboard/settings?tab=billing&addon=canceled`,
    metadata: {
      organization_id: orgId,
      addon_id,
      bonus_amount: String(addon.bonusAmount),
      feature_key: addon.featureKey,
      expires_with_period: addon.expiresWithPeriod ? '1' : '0',
      is_addon: '1',
    },
    ...(mode === 'subscription' ? { subscription_data: { metadata: { organization_id: orgId, addon_id, is_addon: '1' } } } : {}),
  })

  return NextResponse.json({ url: session.url })
}

// DELETE /api/billing/addon
// Body: { addon_id: "support_monthly" }
export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = getServiceClient()
  const { data: orgUser } = await service
    .from('org_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!orgUser) return NextResponse.json({ error: 'Org bulunamadı' }, { status: 403 })

  const orgId = orgUser.organization_id
  const body = await req.json()
  const { addon_id } = body as { addon_id: string }

  if (addon_id !== 'support_monthly') {
    return NextResponse.json({ error: 'Sadece support aboneliği iptal edilebilir' }, { status: 400 })
  }

  // Override'dan sub ID'yi bul
  const { data: override } = await service
    .from('org_entitlement_overrides')
    .select('reason')
    .eq('organization_id', orgId)
    .eq('feature_key', 'dedicated_support')
    .maybeSingle()

  if (!override?.reason?.startsWith('addon_sub:')) {
    return NextResponse.json({ error: 'Aktif abonelik bulunamadı' }, { status: 400 })
  }

  const subId = override.reason.replace('addon_sub:', '')
  const stripe = getStripe()
  await stripe.subscriptions.cancel(subId)
  // Webhook customer.subscription.deleted tetiklenecek → override silinecek

  return NextResponse.json({ ok: true })
}
