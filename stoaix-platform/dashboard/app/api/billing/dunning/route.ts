import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { invalidateCache } from '@/lib/entitlements'

function getServiceClient() {
  return createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// POST /api/billing/dunning — Dunning state machine (Vercel Cron ile çağrılır)
// vercel.json: { "crons": [{ "path": "/api/billing/dunning", "schedule": "0 6 * * *" }] }
export async function POST(req: NextRequest) {
  // Cron secret doğrula
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = getServiceClient()
  const now = new Date()
  const results = { grace_to_past_due: 0, past_due_to_suspended: 0, suspended_to_archived: 0 }

  // grace_period → past_due (3 gün sonra)
  const { data: graceExpired } = await service
    .from('org_subscriptions')
    .select('organization_id')
    .eq('status', 'grace_period')
    .lt('grace_period_ends_at', now.toISOString())

  for (const row of graceExpired ?? []) {
    await service.from('org_subscriptions').update({
      status: 'past_due',
      updated_at: now.toISOString(),
    }).eq('organization_id', row.organization_id)
    invalidateCache(row.organization_id)
    results.grace_to_past_due++
    // TODO: Email #2 gönder
  }

  // past_due → suspended (7 gün sonra = grace_period_ends_at + 4 gün)
  const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000)
  const { data: pastDueExpired } = await service
    .from('org_subscriptions')
    .select('organization_id')
    .eq('status', 'past_due')
    .lt('grace_period_ends_at', fourDaysAgo.toISOString())

  for (const row of pastDueExpired ?? []) {
    await service.from('org_subscriptions').update({
      status: 'suspended',
      updated_at: now.toISOString(),
    }).eq('organization_id', row.organization_id)
    invalidateCache(row.organization_id)
    results.past_due_to_suspended++
    // TODO: Email #3 gönder
  }

  // suspended → archived (30 gün sonra)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const { data: suspendedExpired } = await service
    .from('org_subscriptions')
    .select('organization_id')
    .eq('status', 'suspended')
    .lt('grace_period_ends_at', thirtyDaysAgo.toISOString())

  for (const row of suspendedExpired ?? []) {
    await service.from('organizations').update({ status: 'archived' }).eq('id', row.organization_id)
    await service.from('org_subscriptions').update({ status: 'canceled', updated_at: now.toISOString() }).eq('organization_id', row.organization_id)
    invalidateCache(row.organization_id)
    results.suspended_to_archived++
  }

  console.log('[dunning] Cron tamamlandı:', results)
  return NextResponse.json({ ok: true, ...results })
}
