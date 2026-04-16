import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { getStripe, getPriceId } from '@/lib/stripe'

function getServiceClient() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/admin/billing/[orgId]/offer
// Body: { plan_id, interval, discount_percent? }
// Returns: { checkout_url }
export async function POST(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  // Super admin kontrolü
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = getServiceClient()
  const { data: superAdmin } = await service
    .from('super_admin_users')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!superAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { orgId } = params
  const body = await req.json()
  const { plan_id, interval = 'monthly', discount_percent } = body as {
    plan_id: string
    interval: 'monthly' | 'annual'
    discount_percent?: number
  }

  const validPlans = ['lite', 'plus', 'advanced', 'agency']
  if (!validPlans.includes(plan_id)) {
    return NextResponse.json({ error: 'Geçersiz plan' }, { status: 400 })
  }

  const priceId = getPriceId(plan_id, interval)
  if (!priceId) {
    return NextResponse.json({ error: 'Plan fiyatı yapılandırılmamış' }, { status: 400 })
  }

  // Org bilgisi
  const { data: org } = await service
    .from('organizations')
    .select('id, name')
    .eq('id', orgId)
    .single()
  if (!org) return NextResponse.json({ error: 'Org bulunamadı' }, { status: 404 })

  // Mevcut stripe customer varsa al
  const { data: sub } = await service
    .from('org_subscriptions')
    .select('stripe_customer_id')
    .eq('organization_id', orgId)
    .maybeSingle()

  const stripe = getStripe()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://platform.stoaix.com'

  // Stripe Customer oluştur veya mevcut kullan
  let customerId = sub?.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: org.name,
      metadata: { organization_id: orgId },
    })
    customerId = customer.id

    await service.from('org_subscriptions').upsert({
      organization_id: orgId,
      stripe_customer_id: customerId,
      plan_id: 'legacy',
      status: 'legacy',
    }, { onConflict: 'organization_id' })
  }

  // İndirim kuponu oluştur (opsiyonel)
  let discounts: { coupon: string }[] | undefined
  if (discount_percent && discount_percent > 0 && discount_percent <= 100) {
    const coupon = await stripe.coupons.create({
      percent_off: discount_percent,
      duration: 'once',
      name: `stoaix Legacy Geçiş - %${discount_percent}`,
      max_redemptions: 1,
      metadata: { organization_id: orgId, created_by: user.id },
    })
    discounts = [{ coupon: coupon.id }]
  }

  // Checkout Session oluştur
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 14, // Legacy müşterilere 14 gün trial
      metadata: { organization_id: orgId, plan_id },
    },
    payment_method_collection: 'always',
    discounts,
    success_url: `${appUrl}/dashboard/billing?success=1`,
    cancel_url: `${appUrl}/dashboard/billing`,
    metadata: { organization_id: orgId, plan_id },
    allow_promotion_codes: !discounts, // İndirim varsa promosyon kodu alanı kapatılır
  })

  return NextResponse.json({ checkout_url: session.url })
}
