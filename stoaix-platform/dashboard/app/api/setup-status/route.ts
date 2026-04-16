import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as sbAdmin } from '@supabase/supabase-js'

function getServiceClient() {
  return sbAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

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
  const orgId = orgUser.organization_id

  const [orgResult, kbResult, convResult, playbookResult] = await Promise.all([
    service
      .from('organizations')
      .select('phone, email, city, channel_config')
      .eq('id', orgId)
      .maybeSingle(),
    service
      .from('knowledge_items')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId),
    service
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId),
    service
      .from('agent_playbooks')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('is_active', true),
  ])

  const org = orgResult.data
  const kbCount = kbResult.count ?? 0
  const convCount = convResult.count ?? 0
  const playbookCount = playbookResult.count ?? 0
  const channelConfig = org?.channel_config as any

  return NextResponse.json({
    business_info_complete: !!(org?.phone && org?.email && org?.city),
    has_kb_items: kbCount > 0,
    has_channel: !!(
      channelConfig?.whatsapp?.active === true ||
      channelConfig?.instagram?.active === true ||
      channelConfig?.voice_inbound?.active === true
    ),
    has_playbook: playbookCount > 0,
    has_conversation: convCount > 0,
    kb_count: kbCount,
  })
}
