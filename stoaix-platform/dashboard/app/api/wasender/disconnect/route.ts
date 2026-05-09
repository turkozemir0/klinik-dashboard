import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'

function getServiceClient() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const WASENDER_API_BASE = 'https://www.wasenderapi.com/api'

export async function DELETE() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = getServiceClient()

  const { data: orgUser } = await service
    .from('org_users')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!orgUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (orgUser.role !== 'admin' && orgUser.role !== 'patron') {
    return NextResponse.json({ error: 'Bu işlem için admin yetkisi gerekli' }, { status: 403 })
  }

  const pat = process.env.WASENDER_PAT
  if (!pat) return NextResponse.json({ error: 'WasenderAPI PAT yapılandırılmamış' }, { status: 500 })

  const { data: org } = await service
    .from('organizations')
    .select('channel_config')
    .eq('id', orgUser.organization_id)
    .single()

  const channelConfig = (org?.channel_config ?? {}) as any
  const sessionId = channelConfig?.whatsapp?.credentials?.session_id

  if (sessionId) {
    await fetch(`${WASENDER_API_BASE}/whatsapp-sessions/${sessionId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${pat}` },
    }).catch(() => {})
  }

  const { error: updateErr } = await service
    .from('organizations')
    .update({
      channel_config: {
        ...channelConfig,
        whatsapp: { active: false },
      },
    })
    .eq('id', orgUser.organization_id)

  if (updateErr) {
    console.error('[wasender/disconnect] db update failed:', updateErr)
    return NextResponse.json({ error: 'Bağlantı kesilemedi' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
