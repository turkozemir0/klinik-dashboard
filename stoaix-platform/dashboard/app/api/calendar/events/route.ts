import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as sbAdmin } from '@supabase/supabase-js'
import { checkEntitlement } from '@/lib/entitlements'
import { getOrgCalendar } from '@/lib/calendar-token'

function getServiceClient() {
  return sbAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// GET — Appointments from DB (provider-agnostic)
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await getOrgCalendar(user.id)
  if (!result) return NextResponse.json({ error: 'Org bulunamadı' }, { status: 404 })

  const { orgId, cal } = result

  const ent = await checkEntitlement(orgId, 'calendar_manage')
  if (!ent.enabled) return NextResponse.json({ error: 'upgrade_required', feature: 'calendar_manage' }, { status: 403 })

  const provider      = cal?.provider ?? 'none'
  const lastSyncedAt  = cal?.last_synced_at ?? null

  const { searchParams } = new URL(req.url)
  const sourceFilter = searchParams.get('source') // 'all' | 'platform' | 'google' | 'ai' | 'ghl'
  const from = searchParams.get('from') ?? new Date().toISOString()
  const to   = searchParams.get('to')   ?? new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()

  const service = getServiceClient()
  let query = service
    .from('appointments')
    .select('*, contacts(full_name, phone), leads(qualification_score, status)')
    .eq('organization_id', orgId)
    .gte('scheduled_at', from)
    .lte('scheduled_at', to)
    .order('scheduled_at', { ascending: true })
    .limit(200)

  if (sourceFilter && sourceFilter !== 'all') {
    query = query.eq('source', sourceFilter)
  }

  const { data: appointments, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    connected:      provider !== 'none' || (appointments?.length ?? 0) > 0,
    provider,
    last_synced_at: lastSyncedAt,
    appointments:   appointments ?? [],
  })
}
