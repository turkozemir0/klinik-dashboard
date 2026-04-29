import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { getStripe, getPriceId } from '@/lib/stripe'

function getServiceClient() {
  return createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// POST /api/billing/checkout
// Body: { planId: 'essential'|'professional'|'business'|'custom', interval: 'monthly'|'annual' }
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
  const { planId, interval = 'monthly' } = body as { planId: string; interval: 'monthly' | 'annual' }

  const validPlans = ['essential', 'professional', 'business']
  if (!validPlans.includes(planId)) {
    return NextResponse.json({ error: 'Geçersiz plan' }, { status: 400 })
  }

  const priceId = getPriceId(planId, interval)
  if (!priceId) {
    return NextResponse.json({ error: 'Plan fiyatı henüz yapılandırılmadı' }, { status: 400 })
  }

  // Mevcut subscription + stripe customer kontrolü
  const { data: sub } = await service
    .from('org_subscriptions')
    .select('stripe_customer_id, plan_id, status')
    .eq('organization_id', orgId)
    .maybeSingle()

  const stripe = getStripe()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://platform.stoaix.com'

  // Stripe customer oluştur veya mevcut kullan
  let customerId = sub?.stripe_customer_id
  if (!customerId) {
    const { data: org } = await service
      .from('organizations')
      .select('name, channel_config')
      .eq('id', orgId)
      .single()

    const customer = await stripe.customers.create({
      email: user.email,
      name: org?.name ?? undefined,
      metadata: { organization_id: orgId },
    })
    customerId = customer.id

    // Hemen DB'ye yaz (webhook race condition önlemi)
    await service
      .from('org_subscriptions')
      .upsert({ organization_id: orgId, stripe_customer_id: customerId, plan_id: sub?.plan_id ?? 'legacy', status: sub?.status ?? 'legacy' }, { onConflict: 'organization_id' })
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 7,
      metadata: { organization_id: orgId, plan_id: planId },
    },
    payment_method_collection: 'always', // trial'da da kart zorunlu
    success_url: `${appUrl}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}&success=1`,
    cancel_url: `${appUrl}/dashboard/billing?canceled=1`,
    metadata: { organization_id: orgId, plan_id: planId },
    allow_promotion_codes: true,
    automatic_tax: { enabled: false },
  })

  return NextResponse.json({ url: session.url })
}
