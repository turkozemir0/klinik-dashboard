import { NextRequest, NextResponse } from 'next/server'
import { createClient as sbAdmin } from '@supabase/supabase-js'

// Vercel cron (saatte bir) veya UptimeRobot (5dk) çağırır.
// DB'ye yazmaz — sadece HTTP response döner.
// Hata durumunda max 1 satır/saat DB'ye yazar (throttle).

let lastAlertAt = 0
const ALERT_THROTTLE_MS = 60 * 60 * 1000 // 1 saat

function getServiceClient() {
  return sbAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  const n8nBase = (process.env.N8N_WEBHOOK_BASE_URL ?? '').replace(/\/$/, '')
  const n8nApiKey = process.env.N8N_API_KEY ?? ''

  if (!n8nBase || !n8nApiKey) {
    return NextResponse.json({ ok: false, reason: 'env vars missing' })
  }

  const start = Date.now()
  let status = 'ok'
  let message: string | null = null

  try {
    const res = await fetch(`${n8nBase}/api/v1/workflows?limit=1`, {
      headers: { 'X-N8N-API-KEY': n8nApiKey },
      signal: AbortSignal.timeout(8000),
    })
    const latency = Date.now() - start

    if (!res.ok) {
      status = 'degraded'
      message = `HTTP ${res.status}`
    }

    // Sadece hata durumunda + throttle ile DB'ye yaz (max 1/saat)
    if (status !== 'ok' && Date.now() - lastAlertAt > ALERT_THROTTLE_MS) {
      lastAlertAt = Date.now()
      const service = getServiceClient()
      await service.from('system_alerts').insert({
        service: 'n8n',
        status,
        latency_ms: latency,
        message,
      })
      // Temizlik: 3 günden eski kayıtları sil
      await service.from('system_alerts')
        .delete()
        .lt('created_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())
    }

    return NextResponse.json({ ok: true, status, latency_ms: latency })
  } catch (err: any) {
    const latency = Date.now() - start
    status = 'down'
    message = err.message ?? 'Bağlantı hatası'

    // Throttle: max 1 alert/saat
    if (Date.now() - lastAlertAt > ALERT_THROTTLE_MS) {
      lastAlertAt = Date.now()
      const service = getServiceClient()
      await service.from('system_alerts').insert({
        service: 'n8n',
        status: 'down',
        latency_ms: latency,
        message,
      })
    }

    console.error('[n8n-alert] n8n DOWN:', message)
    return NextResponse.json({ ok: false, status: 'down', error: message, latency_ms: latency })
  }
}
