import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { getStripe } from '@/lib/stripe'

function getServiceClient() {
  return createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// GET /api/billing/payment-method — Mevcut kart bilgisi
export async function GET() {
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

  const { data: sub } = await service
    .from('org_subscriptions')
    .select('stripe_customer_id')
    .eq('organization_id', orgUser.organization_id)
    .maybeSingle()

  if (!sub?.stripe_customer_id) {
    return NextResponse.json({ card: null })
  }

  const stripe = getStripe()
  const customer = await stripe.customers.retrieve(sub.stripe_customer_id, {
    expand: ['invoice_settings.default_payment_method'],
  }) as any

  if (customer.deleted) {
    return NextResponse.json({ card: null })
  }

  const pm = customer.invoice_settings?.default_payment_method
  if (!pm || typeof pm === 'string') {
    return NextResponse.json({ card: null })
  }

  const card = pm.card
  if (!card) {
    return NextResponse.json({ card: null })
  }

  return NextResponse.json({
    card: {
      brand: card.brand,
      last4: card.last4,
      exp_month: card.exp_month,
      exp_year: card.exp_year,
    },
  })
}
