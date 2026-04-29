import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { getStripe } from '@/lib/stripe'

function getServiceClient() {
  return createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// GET /api/billing/invoices — Fatura geçmişi
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
    return NextResponse.json({ invoices: [] })
  }

  const stripe = getStripe()
  const invoices = await stripe.invoices.list({
    customer: sub.stripe_customer_id,
    limit: 24,
  })

  const mapped = invoices.data.map(inv => ({
    id: inv.id,
    date: inv.created ? new Date(inv.created * 1000).toISOString() : null,
    amount: (inv.amount_due ?? 0) / 100,
    currency: inv.currency ?? 'usd',
    status: inv.status,
    pdf_url: inv.invoice_pdf ?? null,
    hosted_url: inv.hosted_invoice_url ?? null,
  }))

  return NextResponse.json({ invoices: mapped })
}
