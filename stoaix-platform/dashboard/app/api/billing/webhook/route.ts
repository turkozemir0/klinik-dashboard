import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { getStripe } from '@/lib/stripe'
import { invalidateCache } from '@/lib/entitlements'
import Stripe from 'stripe'
import * as Sentry from '@sentry/nextjs'

function getServiceClient() {
  return createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook imzası eksik' }, { status: 400 })
  }

  const body = await req.text()
  const stripe = getStripe()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('[webhook] İmza doğrulama hatası:', err)
    return NextResponse.json({ error: 'Geçersiz imza' }, { status: 400 })
  }

  const service = getServiceClient()

  // Idempotency — aynı event iki kez işlenmesin
  const { error: dupErr } = await service
    .from('billing_events')
    .insert({ stripe_event_id: event.id, event_type: event.type, payload: event.data.object as any })

  if (dupErr) {
    // unique constraint violation = zaten işlendi
    if (dupErr.code === '23505') return NextResponse.json({ ok: true, skipped: true })
    console.error('[webhook] billing_events insert error:', dupErr)
  }

  try {
    await handleEvent(event, service)
  } catch (err) {
    console.error('[webhook] Event işleme hatası:', event.type, err)
    Sentry.captureException(err, { extra: { eventType: event.type, route: 'billing/webhook' } })
    // 200 döndür — Stripe retry etmesin, event log'da
    return NextResponse.json({ ok: false, event: event.type })
  }

  return NextResponse.json({ ok: true })
}

async function handleEvent(event: Stripe.Event, service: ReturnType<typeof getServiceClient>) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session

      // Kart güncelleme (setup mode)
      if (session.mode === 'setup') {
        const setupIntent = session.setup_intent as string
        if (setupIntent) {
          const si = await getStripe().setupIntents.retrieve(setupIntent)
          const pmId = si.payment_method as string
          const customerId = session.customer as string
          if (pmId && customerId) {
            await getStripe().customers.update(customerId, {
              invoice_settings: { default_payment_method: pmId },
            })
          }
        }
        break
      }

      // One-time addon purchase (credit packs)
      if (session.mode === 'payment' && session.metadata?.addon_id) {
        const orgId = session.metadata.organization_id
        const featureKey = session.metadata.feature_key
        const bonusAmount = parseInt(session.metadata.bonus_amount || '0', 10)
        if (orgId && featureKey && bonusAmount > 0) {
          await handleAddonPurchase(orgId, featureKey, bonusAmount, service)
        }
        break
      }

      if (session.mode !== 'subscription') break

      const orgId = session.metadata?.organization_id
      const planId = session.metadata?.plan_id
      if (!orgId || !planId) break

      const subId = session.subscription as string
      const sub = await getStripe().subscriptions.retrieve(subId)

      await syncSubscription(orgId, sub, planId, service)
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const orgId = sub.metadata?.organization_id
      if (!orgId) break
      const planId = getPlanIdFromSub(sub)
      await syncSubscription(orgId, sub, planId, service)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const orgId = sub.metadata?.organization_id
      if (!orgId) break

      await service.from('org_subscriptions').update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('organization_id', orgId)

      invalidateCache(orgId)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      const orgId = await getOrgIdByCustomer(customerId, service)
      if (!orgId) break

      const now = new Date()
      const gracePeriodEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) // +3 gün

      await service.from('org_subscriptions').update({
        status: 'grace_period',
        grace_period_ends_at: gracePeriodEnd.toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('organization_id', orgId)

      invalidateCache(orgId)
      // TODO: Email #1 gönder
      break
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      const orgId = await getOrgIdByCustomer(customerId, service)
      if (!orgId) break

      await service.from('org_subscriptions').update({
        status: 'active',
        grace_period_ends_at: null,
        updated_at: new Date().toISOString(),
      }).eq('organization_id', orgId)

      invalidateCache(orgId)
      break
    }

    case 'customer.subscription.trial_will_end': {
      const sub = event.data.object as Stripe.Subscription
      const orgId = sub.metadata?.organization_id
      if (!orgId) break
      // TODO: Email "3 gün kaldı" gönder
      console.log(`[webhook] Trial will end soon for org: ${orgId}`)
      break
    }

    default:
      // Bilinmeyen event — görmezden gel
      break
  }
}

// Stripe subscription → DB sync
async function syncSubscription(
  orgId: string,
  sub: Stripe.Subscription,
  planId: string,
  service: ReturnType<typeof getServiceClient>
) {
  const statusMap: Record<string, string> = {
    active: 'active',
    trialing: 'trialing',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'past_due',
    incomplete: 'past_due',
    incomplete_expired: 'canceled',
    paused: 'suspended',
  }

  const status = statusMap[sub.status] ?? sub.status

  await service.from('org_subscriptions').upsert({
    organization_id: orgId,
    plan_id: planId,
    status,
    stripe_customer_id: sub.customer as string,
    stripe_subscription_id: sub.id,
    billing_interval: sub.items.data[0]?.plan.interval === 'year' ? 'annual' : 'monthly',
    trial_ends_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
    current_period_start: (sub as any).current_period_start ? new Date((sub as any).current_period_start * 1000).toISOString() : null,
    current_period_end: (sub as any).current_period_end ? new Date((sub as any).current_period_end * 1000).toISOString() : null,
    cancel_at_period_end: sub.cancel_at_period_end,
    canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'organization_id' })

  // organizations.plan_id de güncelle
  await service.from('organizations').update({ plan_id: planId }).eq('id', orgId)

  invalidateCache(orgId)
}

// Stripe subscription'dan plan_id çıkar (price metadata'ya bakarak)
function getPlanIdFromSub(sub: Stripe.Subscription): string {
  const meta = sub.metadata?.plan_id
  if (meta) return meta

  // Price ID → plan eşleştirmesi (env var'lardan)
  const priceId = sub.items.data[0]?.price.id
  const priceMap: Record<string, string> = {
    [process.env.STRIPE_PRICE_ESSENTIAL_MONTHLY ?? '']:    'essential',
    [process.env.STRIPE_PRICE_ESSENTIAL_ANNUAL ?? '']:     'essential',
    [process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY ?? '']: 'professional',
    [process.env.STRIPE_PRICE_PROFESSIONAL_ANNUAL ?? '']:  'professional',
    [process.env.STRIPE_PRICE_BUSINESS_MONTHLY ?? '']:     'business',
    [process.env.STRIPE_PRICE_BUSINESS_ANNUAL ?? '']:      'business',
  }
  return priceMap[priceId ?? ''] ?? 'essential'
}

async function getOrgIdByCustomer(customerId: string, service: ReturnType<typeof getServiceClient>): Promise<string | null> {
  const { data } = await service
    .from('org_subscriptions')
    .select('organization_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()
  return data?.organization_id ?? null
}

// Addon credit purchase — org_entitlement_overrides.limit_override += bonus
async function handleAddonPurchase(
  orgId: string,
  featureKey: string,
  bonusAmount: number,
  service: ReturnType<typeof getServiceClient>
) {
  // Mevcut override'ı oku
  const { data: existing } = await service
    .from('org_entitlement_overrides')
    .select('limit_override')
    .eq('organization_id', orgId)
    .eq('feature_key', featureKey)
    .maybeSingle()

  // Plan default'u oku
  const { data: sub } = await service
    .from('org_subscriptions')
    .select('plan_id')
    .eq('organization_id', orgId)
    .maybeSingle()
  const planId = sub?.plan_id ?? 'legacy'

  const { data: entRow } = await service
    .from('plan_entitlements')
    .select('limit_value')
    .eq('plan_id', planId)
    .eq('feature_key', featureKey)
    .maybeSingle()
  const planDefault = entRow?.limit_value ?? 0

  // Yeni limit = mevcut effective limit + bonus
  const currentLimit = existing?.limit_override ?? planDefault
  const newLimit = currentLimit + bonusAmount

  // Upsert override
  await service.from('org_entitlement_overrides').upsert({
    organization_id: orgId,
    feature_key: featureKey,
    enabled: true,
    limit_override: newLimit,
    reason: 'addon_purchase',
  }, { onConflict: 'organization_id,feature_key' })

  invalidateCache(orgId)
}
