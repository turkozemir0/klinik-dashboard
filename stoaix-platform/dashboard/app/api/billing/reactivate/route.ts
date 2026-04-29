import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { getStripe } from '@/lib/stripe'
import { invalidateCache } from '@/lib/entitlements'

function getServiceClient() {
  return createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// POST /api/billing/reactivate — İptal geri alma
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

  const { data: sub } = await service
    .from('org_subscriptions')
    .select('stripe_subscription_id')
    .eq('organization_id', orgId)
    .maybeSingle()

  if (!sub?.stripe_subscription_id) {
    return NextResponse.json({ error: 'Aktif abonelik bulunamadı' }, { status: 400 })
  }

  const stripe = getStripe()
  await stripe.subscriptions.update(sub.stripe_subscription_id, {
    cancel_at_period_end: false,
  })

  await service
    .from('org_subscriptions')
    .update({
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', orgId)

  invalidateCache(orgId)

  return NextResponse.json({ ok: true })
}
