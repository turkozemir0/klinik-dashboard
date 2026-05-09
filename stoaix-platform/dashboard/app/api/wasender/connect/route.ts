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

export async function POST() {
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

  const sessionId = (org?.channel_config as any)?.whatsapp?.credentials?.session_id
  if (!sessionId) {
    return NextResponse.json({ error: 'Session bulunamadı, önce session oluşturun' }, { status: 400 })
  }

  const res = await fetch(`${WASENDER_API_BASE}/whatsapp-sessions/${sessionId}/connect`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${pat}` },
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error('[wasender/connect] WasenderAPI error:', errText)
    return NextResponse.json({ error: 'Bağlantı başlatılamadı' }, { status: 502 })
  }

  // Response: { success: true, data: { status: 'NEED_SCAN', qrCode: '2@...' } }
  const data = await res.json()
  const payload = data.data ?? data
  const qrCode = payload.qrCode ?? payload.qr_code ?? null

  return NextResponse.json({ ok: true, qrCode })
}
