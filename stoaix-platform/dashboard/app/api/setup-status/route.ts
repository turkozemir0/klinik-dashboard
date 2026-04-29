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

  const hasChannel = !!(
    channelConfig?.whatsapp?.active === true ||
    channelConfig?.instagram?.active === true ||
    channelConfig?.voice_inbound?.active === true
  )

  const steps = [
    { key: 'business_info', label: 'İşletme Profilini Tamamla', completed: !!(org?.phone && org?.email && org?.city) },
    { key: 'kb_items',      label: 'Bilgi Bankası Oluştur',     completed: kbCount > 0 },
    { key: 'channel',       label: 'Kanal Bağla',               completed: hasChannel },
    { key: 'playbook',      label: 'AI Asistanını Kur',         completed: playbookCount > 0 },
    { key: 'conversation',  label: 'İlk Konuşmayı Bekle',      completed: convCount > 0 },
  ]
  const percent = Math.round((steps.filter(s => s.completed).length / steps.length) * 100)

  // Fire-and-forget: daily login tracking
  const today = new Date().toISOString().split('T')[0]
  service.from('org_events')
    .select('id').eq('org_id', orgId).eq('event_type', 'dashboard_login')
    .gte('created_at', today + 'T00:00:00Z').limit(1).maybeSingle()
    .then(({ data }) => {
      if (!data) service.from('org_events').insert({ org_id: orgId, event_type: 'dashboard_login', metadata: { user_id: user.id } })
    })

  return NextResponse.json({
    business_info_complete: steps[0].completed,
    has_kb_items: kbCount > 0,
    has_channel: hasChannel,
    has_playbook: playbookCount > 0,
    has_conversation: convCount > 0,
    kb_count: kbCount,
    steps,
    percent,
  })
}
