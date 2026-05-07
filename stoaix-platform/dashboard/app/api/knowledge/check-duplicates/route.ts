import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as sbAdmin } from '@supabase/supabase-js'

const DAILY_LIMIT = 3

function getServiceClient() {
  return sbAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function getRateLimitInfo(orgId: string): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const service = getServiceClient()
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const { data: allowed } = await service.rpc('check_form_rate_limit', {
      p_api_key_hash: `kb_dup_check_${orgId}`,
      p_window_start: todayStart.toISOString(),
      p_max_requests: DAILY_LIMIT,
    })

    if (allowed === false) {
      return { allowed: false, remaining: 0 }
    }

    // Fetch current count to calculate remaining
    const { data: row } = await service
      .from('form_submit_rate_limits')
      .select('request_count')
      .eq('api_key_hash', `kb_dup_check_${orgId}`)
      .gte('window_start', todayStart.toISOString())
      .maybeSingle()

    const used = row?.request_count ?? 1
    return { allowed: true, remaining: DAILY_LIMIT - used }
  } catch {
    return { allowed: true, remaining: DAILY_LIMIT } // fail-open
  }
}

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = getServiceClient()

  const { data: orgUser } = await service
    .from('org_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!orgUser?.organization_id) {
    return NextResponse.json({ error: 'Organizasyon bulunamadı' }, { status: 404 })
  }

  const orgId = orgUser.organization_id

  const { allowed, remaining } = await getRateLimitInfo(orgId)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Günlük limit doldu (3/gün). Yarın tekrar deneyin.' },
      { status: 429 }
    )
  }

  const { data: pairs, error } = await service.rpc('find_duplicate_kb_items', {
    p_org_id: orgId,
    p_threshold: 0.85,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ pairs: pairs ?? [], remaining })
}
