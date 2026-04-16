import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkEntitlement } from '@/lib/entitlements'

const VALID_CHANNELS = ['whatsapp', 'instagram', 'voice', 'web']

async function resolveOrgId(userId: string, service: ReturnType<typeof createServiceClient>) {
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

  const service = createServiceClient()
  const orgId = await resolveOrgId(user.id, service)
  if (!orgId) return NextResponse.json({ error: 'No org' }, { status: 403 })

  const ent = await checkEntitlement(orgId, 'unified_inbox')
  if (!ent.enabled) return NextResponse.json({ error: 'upgrade_required', feature: 'unified_inbox' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const channel    = searchParams.get('channel')
  const leadStatus = searchParams.get('leadStatus')

  let query = service
    .from('conversations')
    .select(`
      id, channel, mode, status, started_at,
      contact:contacts(id, full_name, phone, channel_identifiers),
      lead:leads(id, qualification_score, status)
    `)
    .eq('organization_id', orgId)
    .order('started_at', { ascending: false })
    .limit(50)

  if (channel && channel !== 'all') {
    if (!VALID_CHANNELS.includes(channel)) {
      return NextResponse.json({ error: 'Geçersiz kanal filtresi' }, { status: 400 })
    }
    query = query.eq('channel', channel)
  }

  const { data: conversations, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!conversations?.length) return NextResponse.json({ conversations: [] })

  // JS-side lead status filter (avoids complex joined WHERE)
  const filtered = leadStatus && leadStatus !== 'all'
    ? conversations.filter((c: any) => c.lead?.status === leadStatus)
    : conversations

  // Fetch last message per conversation (best-effort over last 200 messages)
  const convIds = filtered.map((c: any) => c.id)
  const { data: recentMsgs } = await service
    .from('messages')
    .select('conversation_id, content, role, created_at')
    .in('conversation_id', convIds)
    .order('created_at', { ascending: false })
    .limit(200)

  const lastMessages: Record<string, any> = {}
  for (const msg of (recentMsgs ?? [])) {
    if (!lastMessages[msg.conversation_id]) lastMessages[msg.conversation_id] = msg
  }

  const result = filtered.map((c: any) => ({
    ...c,
    last_message: lastMessages[c.id] ?? null,
  }))

  return NextResponse.json({ conversations: result })
}
