import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as sbAdmin } from '@supabase/supabase-js'

function getServiceClient() {
  return sbAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  // Sadece super admin erişebilir
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: sa } = await supabase
    .from('super_admin_users')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!sa) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const n8nBase = (process.env.N8N_WEBHOOK_BASE_URL ?? '').replace(/\/$/, '')
  const n8nApiKey = process.env.N8N_API_KEY ?? ''

  if (!n8nBase || !n8nApiKey) {
    return NextResponse.json({ status: 'unknown', error: 'N8N_WEBHOOK_BASE_URL veya N8N_API_KEY eksik' })
  }

  const start = Date.now()
  try {
    const res = await fetch(`${n8nBase}/api/v1/workflows?limit=1`, {
      headers: { 'X-N8N-API-KEY': n8nApiKey },
      signal: AbortSignal.timeout(5000),
    })
    const latency = Date.now() - start

    // Yanıtı DB'ye kaydet
    const service = getServiceClient()
    const status = res.ok ? 'ok' : 'degraded'
    await service.from('system_alerts').insert({
      service: 'n8n',
      status,
      latency_ms: latency,
      message: res.ok ? null : `HTTP ${res.status}`,
    })

    return NextResponse.json({ status, latency_ms: latency, http_status: res.status })
  } catch (err: any) {
    const latency = Date.now() - start

    const service = getServiceClient()
    await service.from('system_alerts').insert({
      service: 'n8n',
      status: 'down',
      latency_ms: latency,
      message: err.message ?? 'Bağlantı hatası',
    })

    return NextResponse.json({ status: 'down', error: err.message, latency_ms: latency })
  }
}
