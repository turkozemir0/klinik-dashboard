// @ts-nocheck — Deno Edge Function; Node.js TypeScript derleyicisi tarafından işlenmemeli
// ═══════════════════════════════════════════════════════════════
// stoaix AI Klinik System — EDGE FUNCTION v2 (Multi-CRM)
// Dosya: supabase/functions/handle-incoming-message/index.ts
//
// SECRETS (Supabase Dashboard → Settings → Edge Functions → Secrets):
//   N8N_WEBHOOK_URL  → n8n workflow tetikleme URL'i
//
// OTOMATIK MEVCUT:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// WEBHOOK URL (her klinik için):
//   POST https://[supabase-url]/functions/v1/handle-incoming-message?token={webhook_token}
//   veya header: x-clinic-token: {webhook_token}
// ═══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-clinic-token',
}

// Flat field_map ile payload'dan değer çeker
// field_map örneği: { "contact_id": "contactId", "message": "body.text" }
// Nokta notasyonu ile nested field desteği: "body.contact.id"
function extractField(payload: Record<string, unknown>, fieldPath: string): unknown {
  const parts = fieldPath.split('.')
  let current: unknown = payload
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

// crm_provider'a göre gelen payload'u standart formata normalize eder
function normalizePayload(
  rawPayload: Record<string, unknown>,
  crmProvider: string,
  crmConfig: Record<string, unknown>
): { contactId: string | null; message: string; phone: string | null; attachments: unknown[] } {
  if (crmProvider === 'ghl') {
    // GHL formatı: contact_id, message veya body, attachments
    const contactId = (rawPayload.contact_id || rawPayload.contactId) as string | null
    const message   = (rawPayload.message || rawPayload.body || '') as string
    const phone     = (rawPayload.phone || rawPayload.contact_phone || null) as string | null
    const attachments = (rawPayload.attachments || []) as unknown[]
    return { contactId, message, phone, attachments }
  }

  if (crmProvider === 'custom') {
    // custom: crm_config.field_map ile dinamik parse
    const fieldMap = (crmConfig.field_map || {}) as Record<string, string>
    const contactId  = fieldMap.contact_id ? extractField(rawPayload, fieldMap.contact_id) as string : null
    const message    = fieldMap.message    ? extractField(rawPayload, fieldMap.message)    as string ?? '' : ''
    const phone      = fieldMap.phone      ? extractField(rawPayload, fieldMap.phone)      as string : null
    const attachments: unknown[] = []
    return { contactId, message, phone, attachments }
  }

  // Diğer CRM'ler için varsayılan: standart alan adları dene
  const contactId = (rawPayload.contact_id || rawPayload.contactId || rawPayload.id) as string | null
  const message   = (rawPayload.message || rawPayload.body || rawPayload.text || '') as string
  const phone     = (rawPayload.phone || null) as string | null
  const attachments = (rawPayload.attachments || []) as unknown[]
  return { contactId, message, phone, attachments }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl  = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL')

    if (!n8nWebhookUrl) {
      throw new Error('N8N_WEBHOOK_URL secret eksik!')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // ── 1. Webhook token'ı al (query param veya header) ──────────
    const url = new URL(req.url)
    const webhookToken = url.searchParams.get('token') || req.headers.get('x-clinic-token')

    if (!webhookToken) {
      return new Response(JSON.stringify({ error: 'webhook_token eksik. ?token= parametresi veya x-clinic-token header gerekli.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // ── 2. Token'a göre klinik bul ────────────────────────────────
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .select('id, crm_provider, crm_config, crm_token')
      .eq('webhook_token', webhookToken)
      .eq('status', 'active')
      .single()

    if (clinicError || !clinic) {
      return new Response(JSON.stringify({ error: 'Geçersiz webhook token veya klinik bulunamadı.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const clinicId    = clinic.id
    const crmProvider = clinic.crm_provider || 'ghl'
    const crmConfig   = (clinic.crm_config || {}) as Record<string, unknown>

    // ── 3. Gelen payload'u normalize et ──────────────────────────
    const rawPayload = await req.json()
    const { contactId, message, phone, attachments } = normalizePayload(rawPayload, crmProvider, crmConfig)

    if (!contactId) {
      return new Response(JSON.stringify({ error: 'contact_id payload\'dan çıkarılamadı.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // ── 4. Mesajı buffer'a yaz ────────────────────────────────────
    const { error: insertError } = await supabase
      .from('message_buffer')
      .insert({
        contact_id: contactId,
        message_text:   message || '',
        contains_image: (attachments as unknown[]).length > 0,
        image_url:      (attachments as unknown[]).length > 0 ? (attachments[0] as Record<string, unknown>).url as string : null,
        clinic_id:      clinicId,
      })

    if (insertError) throw insertError

    // ── 5. Kilit kontrolü ─────────────────────────────────────────
    const { data: lockData } = await supabase
      .from('conversation_locks')
      .select('*')
      .eq('contact_id', contactId)
      .single()

    const now = new Date()

    if (lockData) {
      const expiresAt = new Date(lockData.expires_at)
      if (lockData.status !== 'idle' && now < expiresAt) {
        return new Response(JSON.stringify({ status: 'buffered', message: "Mevcut batch'e eklendi" }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }
    }

    // ── 6. Kilit oluştur (60 saniyelik güvenlik kilidi) ───────────
    await supabase
      .from('conversation_locks')
      .upsert({
        contact_id: contactId,
        status:     'waiting',
        locked_at:  now.toISOString(),
        expires_at: new Date(now.getTime() + 60000).toISOString(),
      }, { onConflict: 'contact_id' })

    // ── 7. Debounce (4 saniye — arka arkaya mesajları birleştir) ──
    await new Promise(resolve => setTimeout(resolve, 4000))

    // ── 8. Buffer'daki tüm mesajları topla ────────────────────────
    const { data: messages } = await supabase
      .from('message_buffer')
      .select('*')
      .eq('contact_id', contactId)
      .order('received_at', { ascending: true })

    if (!messages || messages.length === 0) {
      await supabase
        .from('conversation_locks')
        .update({ status: 'idle' })
        .eq('contact_id', contactId)
      return new Response(JSON.stringify({ status: 'empty' }), { headers: corsHeaders })
    }

    const isSpam    = messages.length > 10
    const spamReply = isSpam ? 'Mesajlarınızı aldım, sırayla inceliyorum.' : null
    const fullText  = messages.map((m: Record<string, unknown>) => m.message_text).filter(Boolean).join('\n')
    const hasImage  = messages.some((m: Record<string, unknown>) => m.contains_image)
    const imageCount = messages.filter((m: Record<string, unknown>) => m.contains_image).length
    const imageUrl  = messages.find((m: Record<string, unknown>) => m.image_url)?.image_url || null
    const bufferIds = messages.map((m: Record<string, unknown>) => m.id)

    // ── 9. n8n'e gönder ───────────────────────────────────────────
    // crm_config'den token hariç tut (sadece yapısal bilgi gönder)
    const safeCrmConfig = { ...crmConfig }
    // crm_token n8n payload'una EKLENMEz — n8n Supabase'den okur
    const n8nPayload = {
      contactId,
      clinicId,
      contactPhone:  phone,
      mergedMessage: fullText || (hasImage ? '(Görsel gönderildi)' : ''),
      containsImage: hasImage,
      imageCount,
      imageUrl,
      isSpam,
      spamReply,
      bufferIds,
      crmType:       crmProvider,
      crmConfig:     safeCrmConfig,
    }

    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(n8nPayload),
    })

    // ── 10. Temizlik ──────────────────────────────────────────────
    await supabase.from('message_buffer').delete().in('id', bufferIds)
    await supabase
      .from('conversation_locks')
      .update({ status: 'processing' })
      .eq('contact_id', contactId)

    return new Response(JSON.stringify({
      status:    'forwarded',
      count:     messages.length,
      crmType:   crmProvider,
      n8nStatus: n8nResponse.status,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
