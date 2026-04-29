import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { getStripe } from '@/lib/stripe'
import { invalidateCache } from '@/lib/entitlements'

function getServiceClient() {
  return createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// POST /api/billing/cancel — 3 fazlı iptal + retention
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
    .select('stripe_subscription_id, stripe_customer_id, plan_id, status')
    .eq('organization_id', orgId)
    .maybeSingle()

  if (!sub?.stripe_subscription_id) {
    return NextResponse.json({ error: 'Aktif abonelik bulunamadı' }, { status: 400 })
  }

  // legacy/custom iptal edilemez
  if (sub.plan_id === 'legacy' || sub.plan_id === 'custom') {
    return NextResponse.json({ error: 'Bu plan türü için iptal yapılamaz' }, { status: 400 })
  }

  const body = await req.json()
  const { action } = body

  // ── Phase 1: Feedback kaydet ──
  if (action === 'save_feedback') {
    const { cancel_reason, cancel_reason_text, satisfaction, satisfaction_note } = body

    if (!cancel_reason) {
      return NextResponse.json({ error: 'İptal nedeni gerekli' }, { status: 400 })
    }

    // Son 90 günde retention teklifi kabul edilmiş mi kontrol et
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    const { data: recentRetention } = await service
      .from('cancellation_feedback')
      .select('id')
      .eq('organization_id', orgId)
      .eq('final_action', 'retained_with_discount')
      .gte('created_at', ninetyDaysAgo)
      .limit(1)

    const retentionEligible = !recentRetention || recentRetention.length === 0

    const { data: feedback, error: insertErr } = await service
      .from('cancellation_feedback')
      .insert({
        organization_id: orgId,
        user_id: user.id,
        cancel_reason,
        cancel_reason_text: cancel_reason_text || null,
        satisfaction: satisfaction || null,
        satisfaction_note: satisfaction_note || null,
        retention_offered: retentionEligible,
        final_action: 'pending',
      })
      .select('id')
      .single()

    if (insertErr) {
      console.error('[cancel] feedback insert error:', insertErr)
      return NextResponse.json({ error: 'Kayıt hatası' }, { status: 500 })
    }

    return NextResponse.json({
      feedback_id: feedback.id,
      retention_eligible: retentionEligible,
    })
  }

  // ── Phase 2a: Retention teklifi kabul ──
  if (action === 'accept_discount') {
    const { feedback_id } = body
    if (!feedback_id) return NextResponse.json({ error: 'feedback_id gerekli' }, { status: 400 })

    const stripe = getStripe()

    // Kupon oluştur: %40, 1 fatura dönemi
    const coupon = await stripe.coupons.create({
      percent_off: 40,
      duration: 'repeating',
      duration_in_months: 1,
      metadata: { organization_id: orgId, feedback_id },
    })

    // Subscription'a uygula
    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      discounts: [{ coupon: coupon.id }],
    })

    // Feedback güncelle
    await service
      .from('cancellation_feedback')
      .update({
        retention_accepted: true,
        retention_coupon_id: coupon.id,
        final_action: 'retained_with_discount',
      })
      .eq('id', feedback_id)

    invalidateCache(orgId)

    return NextResponse.json({ ok: true, discount_applied: true })
  }

  // ── Phase 2b: İptal onayla ──
  if (action === 'confirm_cancel') {
    const { feedback_id } = body

    const stripe = getStripe()
    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: true,
    })

    // Feedback güncelle
    if (feedback_id) {
      await service
        .from('cancellation_feedback')
        .update({ final_action: 'canceled' })
        .eq('id', feedback_id)
    }

    // DB güncelle
    await service
      .from('org_subscriptions')
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', orgId)

    invalidateCache(orgId)

    return NextResponse.json({ ok: true, canceled: true })
  }

  return NextResponse.json({ error: 'Geçersiz action' }, { status: 400 })
}
