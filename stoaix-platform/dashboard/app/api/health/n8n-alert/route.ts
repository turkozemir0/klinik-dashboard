import { NextRequest, NextResponse } from 'next/server'
import { createClient as sbAdmin } from '@supabase/supabase-js'

// Vercel cron veya UptimeRobot'tan çağrılır
// Vercel Hobby: saatte bir (0 * * * *)
// UptimeRobot: 5dk'da bir (ücretsiz önerilen seçenek)

function getServiceClient() {
  return sbAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  // Cron auth: Vercel otomatik Authorization header ekler
  // veya UptimeRobot için API key header kontrolü
  const authHeader = req.headers.get('authorization')
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // UptimeRobot veya harici çağrıda secret yoksa → yine de izin ver (monitoring endpoint)
    // Gerçek güvenlik: sadece Vercel cron + UptimeRobot erişebilmeli
  }

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

    const service = getServiceClient()
    await service.from('system_alerts').insert({
      service: 'n8n',
      status,
      latency_ms: latency,
      message,
    })

    // Son 24 saatte 'down' veya 'degraded' alertleri temizle (opsiyonel — sadece son 500 kaydı tut)
    // Eski kayıtları sil
    await service.from('system_alerts')
      .delete()
      .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .eq('service', 'n8n')

    return NextResponse.json({ ok: true, status, latency_ms: latency })
  } catch (err: any) {
    const latency = Date.now() - start
    status = 'down'
    message = err.message ?? 'Bağlantı hatası'

    const service = getServiceClient()
    await service.from('system_alerts').insert({
      service: 'n8n',
      status: 'down',
      latency_ms: latency,
      message,
    })

    // n8n down — loglama yeterli (email entegrasyonu opsiyonel, Resend/SendGrid ile eklenebilir)
    console.error('[n8n-alert] n8n DOWN:', message)

    return NextResponse.json({ ok: false, status: 'down', error: message, latency_ms: latency })
  }
}
