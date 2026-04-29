import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { getStripe } from '@/lib/stripe'

function getServiceClient() {
  return createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

const ADDON_CATALOG: Record<string, { name: string; priceEnvKey: string; bonusAmount: number; featureKey: string }> = {
  reactivation_10k: {
    name: 'Reactivation Credit Pack (+10.000 Lead)',
    priceEnvKey: 'STRIPE_PRICE_REACTIVATION_10K',
    bonusAmount: 10000,
    featureKey: 'workflow_reactivation',
  },
}

// POST /api/billing/addon
// Body: { addon_id: "reactivation_10k" }
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

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/settings?tab=billing&addon=success`,
    cancel_url: `${appUrl}/dashboard/settings?tab=billing&addon=canceled`,
    metadata: {
      organization_id: orgId,
      addon_id,
      bonus_amount: String(addon.bonusAmount),
      feature_key: addon.featureKey,
    },
  })

  return NextResponse.json({ url: session.url })
}
