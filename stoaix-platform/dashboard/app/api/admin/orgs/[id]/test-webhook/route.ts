import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'

function getServiceClient() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function isSuperAdmin(userId: string): Promise<boolean> {
  const service = getServiceClient()
  const { data } = await service
    .from('super_admin_users')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()
  return !!data
}

async function hmacSignature(secret: string, body: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await isSuperAdmin(user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { webhook_url, webhook_secret } = await req.json()
  if (!webhook_url) return NextResponse.json({ error: 'webhook_url gerekli' }, { status: 400 })

  const payload = JSON.stringify({
    event:     'test',
    org_id:    params.id,
    message:   'stoaix webhook test — bu bir test mesajıdır',
    timestamp: new Date().toISOString(),
  })

  const headers: Record<string, string> = {
    'Content-Type':   'application/json',
    'X-Stoaix-Event': 'test',
  }

  if (webhook_secret) {
    const sig = await hmacSignature(webhook_secret, payload)
    headers['X-Stoaix-Signature'] = `sha256=${sig}`
  }

  try {
    const res = await fetch(webhook_url, {
      method:  'POST',
      headers,
      body:    payload,
      signal:  AbortSignal.timeout(10_000),
    })
    if (!res.ok) return NextResponse.json({ error: `Webhook ${res.status} döndü` }, { status: 502 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Webhook ulaşılamadı' }, { status: 502 })
  }
}
