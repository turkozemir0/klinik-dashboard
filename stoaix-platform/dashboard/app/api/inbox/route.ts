import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as sbAdmin } from '@supabase/supabase-js'
import { checkEntitlement } from '@/lib/entitlements'

function getServiceClient() {
  return sbAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

const VALID_CHANNELS = ['whatsapp', 'instagram', 'voice', 'web', 'reactivation']
const DEFAULT_LIMIT = 20

async function resolveOrgId(userId: string, service: ReturnType<typeof getServiceClient>) {
  const { data: orgUser } = await service
    .from('org_users')
    .select('organization_id')
    .eq('user_id', userId)
    .maybeSingle()
  if (orgUser?.organization_id) return orgUser.organization_id

  const { data: sa } = await service
    .from('super_admin_users')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()
  if (sa) {
    const { data: firstOrg } = await service
      .from('organizations')
      .select('id')
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()
    return firstOrg?.id ?? null
  }
  return null
}

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = getServiceClient()
  const orgId = await resolveOrgId(user.id, service)
  if (!orgId) return NextResponse.json({ error: 'No org' }, { status: 403 })

  const ent = await checkEntitlement(orgId, 'unified_inbox')
  if (!ent.enabled) return NextResponse.json({ error: 'upgrade_required', feature: 'unified_inbox' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const channel    = searchParams.get('channel')
  const leadStatus = searchParams.get('leadStatus')
  const cursor     = searchParams.get('cursor')       // ISO timestamp for pagination
  const search     = searchParams.get('search')        // search query
  const limit      = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '') || DEFAULT_LIMIT, 1), 50)

  // ── Search: get matching conversation IDs via RPC ──────────────────────
  let searchConvIds: string[] | null = null
  if (search && search.length >= 2) {
    const { data: rpcResult, error: rpcError } = await service
      .rpc('search_inbox_conversations', { p_org_id: orgId, p_search_text: search })

    if (rpcError) {
      console.error('[inbox] search RPC error:', rpcError.message)
      return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }
    searchConvIds = (rpcResult ?? []).map((r: any) => r.conversation_id)
    if (searchConvIds.length === 0) {
      return NextResponse.json({ conversations: [], hasMore: false, nextCursor: null })
    }
  }

  // ── Build main query ──────────────────────────────────────────────────
  // Use !inner join for lead status filtering (DB-level) vs normal left join
  const filterByLead = leadStatus && leadStatus !== 'all'
  const selectStr = filterByLead
    ? `id, channel, mode, status, started_at, contact:contacts(id, full_name, phone, channel_identifiers), lead:leads!inner(id, qualification_score, status, collected_data, source_channel)`
    : `id, channel, mode, status, started_at, contact:contacts(id, full_name, phone, channel_identifiers), lead:leads(id, qualification_score, status, collected_data, source_channel)`

  // Channel validation early
  if (channel && channel !== 'all' && !VALID_CHANNELS.includes(channel)) {
    return NextResponse.json({ error: 'Geçersiz kanal filtresi' }, { status: 400 })
  }

  // Build query with type-loosened chain to avoid TS infinite depth
  let q: any = service
    .from('conversations')
    .select(selectStr)
    .eq('organization_id', orgId)
    .order('started_at', { ascending: false })
    .limit(limit + 1) // fetch one extra to determine hasMore

  if (channel && channel !== 'all') q = q.eq('channel', channel)
  if (filterByLead) q = q.eq('lead.status', leadStatus)
  if (cursor) q = q.lt('started_at', cursor)
  if (searchConvIds) q = q.in('id', searchConvIds)

  const { data: conversations, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!conversations?.length) {
    return NextResponse.json({ conversations: [], hasMore: false, nextCursor: null })
  }

  // Determine hasMore + trim to actual limit
  const hasMore = conversations.length > limit
  const trimmed = hasMore ? conversations.slice(0, limit) : conversations
  const nextCursor = hasMore ? trimmed[trimmed.length - 1].started_at : null

  // Fetch last message per conversation
  const convIds = trimmed.map((c: any) => c.id)
  const { data: recentMsgs } = await service
    .from('messages')
    .select('conversation_id, content, role, created_at')
    .in('conversation_id', convIds)
    .order('created_at', { ascending: false })
    .limit(convIds.length * 4)

  const lastMessages: Record<string, any> = {}
  for (const msg of (recentMsgs ?? [])) {
    if (!lastMessages[msg.conversation_id]) lastMessages[msg.conversation_id] = msg
  }

  const result = trimmed.map((c: any) => ({
    ...c,
    last_message: lastMessages[c.id] ?? null,
  }))

  return NextResponse.json({ conversations: result, hasMore, nextCursor })
}
