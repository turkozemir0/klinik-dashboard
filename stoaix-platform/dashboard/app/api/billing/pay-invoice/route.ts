import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { getStripe } from '@/lib/stripe'

function getServiceClient() {
  return createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// POST /api/billing/pay-invoice — Açık faturayı öde
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

  // Verify subscription belongs to this org
  const { data: sub } = await service
    .from('org_subscriptions')
    .select('stripe_customer_id')
    .eq('organization_id', orgUser.organization_id)
    .maybeSingle()

  if (!sub?.stripe_customer_id) {
    return NextResponse.json({ error: 'Abonelik bulunamadı' }, { status: 400 })
  }

  const body = await req.json()
  const { invoice_id } = body

  if (!invoice_id || typeof invoice_id !== 'string') {
    return NextResponse.json({ error: 'invoice_id gerekli' }, { status: 400 })
  }

  const stripe = getStripe()

  // Faturanın bu müşteriye ait olduğunu doğrula
  const invoice = await stripe.invoices.retrieve(invoice_id)
  if (invoice.customer !== sub.stripe_customer_id) {
    return NextResponse.json({ error: 'Bu fatura size ait değil' }, { status: 403 })
  }

  try {
    await stripe.invoices.pay(invoice_id)
    return NextResponse.json({ ok: true, paid: true })
  } catch (err: any) {
    // Kart declined — hosted URL fallback
    const refreshed = await stripe.invoices.retrieve(invoice_id)
    return NextResponse.json({
      ok: false,
      paid: false,
      hosted_url: refreshed.hosted_invoice_url ?? null,
      error_message: err?.message ?? 'Ödeme başarısız',
    })
  }
}
