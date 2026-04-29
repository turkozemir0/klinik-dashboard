import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { getStripe } from '@/lib/stripe'

function getServiceClient() {
  return createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// POST /api/billing/payment-method/update — Kart güncelleme (Stripe setup checkout)
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

  const { data: sub } = await service
    .from('org_subscriptions')
    .select('stripe_customer_id')
    .eq('organization_id', orgUser.organization_id)
    .maybeSingle()

  if (!sub?.stripe_customer_id) {
    return NextResponse.json({ error: 'Müşteri bulunamadı' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://platform.stoaix.com'
  const stripe = getStripe()

  const session = await stripe.checkout.sessions.create({
    mode: 'setup',
    customer: sub.stripe_customer_id,
    payment_method_types: ['card'],
    success_url: `${appUrl}/dashboard/settings?tab=billing&pm_updated=1`,
    cancel_url: `${appUrl}/dashboard/settings?tab=billing`,
    metadata: {
      organization_id: orgUser.organization_id,
      purpose: 'update_payment_method',
    },
  })

  return NextResponse.json({ url: session.url })
}
