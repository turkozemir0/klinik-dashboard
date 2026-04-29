import { createClient as sbAdmin } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

function getService() {
  return sbAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/** Check if org is the demo org */
export function isDemoOrg(orgId: string | null | undefined): boolean {
  return !!orgId && orgId === process.env.DEMO_ORG_ID
}

/** Block write operations for demo org. Returns NextResponse if blocked, null if allowed. */
export function demoWriteBlock(orgId: string | null | undefined): NextResponse | null {
  if (!isDemoOrg(orgId)) return null
  return NextResponse.json(
    { error: 'demo_readonly', message: 'Demo hesapta bu işlem yapılamaz.' },
    { status: 403 }
  )
}

/** Get ref_code from cookie */
export function getDemoRef(): string {
  try {
    return cookies().get('demo_ref')?.value || '_no_ref'
  } catch {
    return '_no_ref'
  }
}

const LIMITS: Record<string, { withRef: number; noRef: number }> = {
  voice_minutes:     { withRef: 10, noRef: 3 },
  chatbot_messages:  { withRef: 30, noRef: 10 },
}

/** Check demo rate limit. Returns null if OK, or error response if exceeded. */
export async function checkDemoRateLimit(
  refCode: string,
  metric: string
): Promise<{ error: string; limit: number; used: number } | null> {
  const cfg = LIMITS[metric]
  if (!cfg) return null

  const limit = refCode === '_no_ref' ? cfg.noRef : cfg.withRef

  const service = getService()
  const { data } = await service
    .from('demo_usage')
    .select('value')
    .eq('ref_code', refCode)
    .eq('metric', metric)
    .eq('date', new Date().toISOString().slice(0, 10))
    .maybeSingle()

  const used = Number(data?.value ?? 0)
  if (used >= limit) {
    return { error: 'demo_limit_reached', limit, used }
  }
  return null
}

/** Increment demo usage counter (upsert) */
export async function incrementDemoUsage(
  refCode: string,
  metric: string,
  amount: number = 1
): Promise<void> {
  const service = getService()
  const today = new Date().toISOString().slice(0, 10)

  // Try upsert with ON CONFLICT
  const { error } = await service.rpc('increment_demo_usage', {
    p_ref: refCode,
    p_metric: metric,
    p_amount: amount,
    p_date: today,
  })

  // Fallback if RPC doesn't exist: manual upsert
  if (error) {
    const { data: existing } = await service
      .from('demo_usage')
      .select('id, value')
      .eq('ref_code', refCode)
      .eq('metric', metric)
      .eq('date', today)
      .maybeSingle()

    if (existing) {
      await service
        .from('demo_usage')
        .update({ value: Number(existing.value) + amount })
        .eq('id', existing.id)
    } else {
      await service
        .from('demo_usage')
        .insert({ ref_code: refCode, metric, value: amount, date: today })
    }
  }
}
