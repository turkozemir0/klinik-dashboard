// @ts-nocheck — Deno Edge Function
// ═══════════════════════════════════════════════════════════════
// stoaix CRM Gateway v1
// Dosya: supabase/functions/crm-gateway/index.ts
//
// SECRETS:
//   GATEWAY_SECRET         → n8n'in bu gateway'i çağırırken kullandığı secret
//   SUPABASE_URL           → otomatik
//   SUPABASE_SERVICE_ROLE_KEY → otomatik
//
// REQUEST FORMAT:
//   POST /crm-gateway
//   Headers: x-gateway-secret: {GATEWAY_SECRET}
//   Body: {
//     version: "v1",
//     action: "send_message" | "update_contact_fields" | "add_tags" |
//             "remove_tags" | "move_pipeline_stage" | "create_note",
//     clinic_id: "uuid",
//     correlation_id: "uuid",
//     idempotency_key: "string",
//     params: { ... }
//   }
// ═══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-gateway-secret',
}

// ── Capability Matrix ─────────────────────────────────────────
const CAPABILITIES: Record<string, Record<string, boolean>> = {
  ghl: {
    send_message:            true,
    update_contact_fields:   true,
    add_tags:                true,
    remove_tags:             true,
    move_pipeline_stage:     true,
    create_note:             true,
  },
  hubspot: {
    send_message:            false,
    update_contact_fields:   true,
    add_tags:                true,
    remove_tags:             true,
    move_pipeline_stage:     true,
    create_note:             true,
  },
  kommo: {
    send_message:            true,
    update_contact_fields:   true,
    add_tags:                true,
    remove_tags:             true,
    move_pipeline_stage:     true,
    create_note:             true,
  },
  custom: {
    send_message:            true,
    update_contact_fields:   false,
    add_tags:                false,
    remove_tags:             false,
    move_pipeline_stage:     false,
    create_note:             false,
  },
}

// ── Error helpers ─────────────────────────────────────────────
function classifyHttpError(status: number): string {
  if (status === 401 || status === 403) return 'auth_error'
  if (status === 429 || status >= 500)  return 'retryable'
  return 'non_retryable'
}

function gatewayError(type: string, message: string, extra = {}) {
  return { success: false, error_type: type, error_message: message, ...extra }
}

// ── GHL Helpers ───────────────────────────────────────────────
const GHL_BASE = 'https://services.leadconnectorhq.com'
const GHL_VERSION = '2021-07-28'

function ghlHeaders(token: string) {
  return {
    'Authorization': `Bearer ${token}`,
    'Version': GHL_VERSION,
    'Content-Type': 'application/json',
  }
}

// ── GHL Implementations ───────────────────────────────────────

async function ghlSendMessage(config: any, token: string, params: any) {
  const url = config.send_message_url || `${GHL_BASE}/conversations/messages`
  const res = await fetch(url, {
    method: 'POST',
    headers: ghlHeaders(token),
    body: JSON.stringify({
      type:      params.message_type || 'SMS',
      contactId: params.contact_id,
      message:   params.message,
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return { ok: false, status: res.status, data }
  return { ok: true, data }
}

async function ghlUpdateContactFields(config: any, token: string, params: any) {
  const fieldMap = config.custom_fields || {}
  const customFields = Object.entries(params.fields || {})
    .filter(([key]) => fieldMap[key])
    .map(([key, value]) => ({ id: fieldMap[key], field_value: String(value) }))

  if (customFields.length === 0) return { ok: true, data: { skipped: 'no mapped fields' } }

  const res = await fetch(`${GHL_BASE}/contacts/${params.contact_id}`, {
    method: 'PUT',
    headers: ghlHeaders(token),
    body: JSON.stringify({ customFields }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return { ok: false, status: res.status, data }
  return { ok: true, data }
}

async function ghlAddTags(config: any, token: string, params: any) {
  const res = await fetch(`${GHL_BASE}/contacts/${params.contact_id}/tags`, {
    method: 'POST',
    headers: ghlHeaders(token),
    body: JSON.stringify({ tags: params.tags }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return { ok: false, status: res.status, data }
  return { ok: true, data }
}

async function ghlRemoveTags(config: any, token: string, params: any) {
  const res = await fetch(`${GHL_BASE}/contacts/${params.contact_id}/tags`, {
    method: 'DELETE',
    headers: ghlHeaders(token),
    body: JSON.stringify({ tags: params.tags }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return { ok: false, status: res.status, data }
  return { ok: true, data }
}

async function ghlMovePipelineStage(config: any, token: string, params: any) {
  const stages = config.pipeline_stages || {}
  const stageId = stages[params.stage_name] || params.stage_id
  if (!stageId) return { ok: false, status: 400, data: { error: `stage_name "${params.stage_name}" crm_config.pipeline_stages içinde bulunamadı` } }

  // Mevcut opportunity'yi bul veya oluştur
  const searchRes = await fetch(
    `${GHL_BASE}/opportunities/search?pipeline_id=${config.pipeline_id}&contact_id=${params.contact_id}`,
    { headers: ghlHeaders(token) }
  )
  const searchData = await searchRes.json().catch(() => ({ opportunities: [] }))
  const existing = searchData.opportunities?.[0]

  if (existing) {
    const res = await fetch(`${GHL_BASE}/opportunities/${existing.id}`, {
      method: 'PUT',
      headers: ghlHeaders(token),
      body: JSON.stringify({ pipelineStageId: stageId }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { ok: false, status: res.status, data }
    return { ok: true, data }
  } else {
    const res = await fetch(`${GHL_BASE}/opportunities/`, {
      method: 'POST',
      headers: ghlHeaders(token),
      body: JSON.stringify({
        pipelineId:      config.pipeline_id,
        pipelineStageId: stageId,
        contactId:       params.contact_id,
        name:            params.opportunity_name || 'stoaix Lead',
        monetaryValue:   params.opportunity_value || 0,
        status:          'open',
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { ok: false, status: res.status, data }
    return { ok: true, data }
  }
}

async function ghlCreateNote(config: any, token: string, params: any) {
  const res = await fetch(`${GHL_BASE}/contacts/${params.contact_id}/notes`, {
    method: 'POST',
    headers: ghlHeaders(token),
    body: JSON.stringify({ body: params.note }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return { ok: false, status: res.status, data }
  return { ok: true, data }
}

// ── Custom CRM Implementations ────────────────────────────────

async function customSendMessage(config: any, token: string, params: any) {
  const url = config.send_message_url
  if (!url) return { ok: false, status: 400, data: { error: 'send_message_url crm_config içinde tanımlı değil' } }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contactId: params.contact_id,
      message:   params.message,
      ...(config.field_map || {}),
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return { ok: false, status: res.status, data }
  return { ok: true, data }
}

// ── Action Router ─────────────────────────────────────────────

async function executeAction(
  provider: string,
  action: string,
  config: any,
  token: string,
  params: any
): Promise<{ ok: boolean; status?: number; data: any }> {
  if (provider === 'ghl') {
    switch (action) {
      case 'send_message':          return ghlSendMessage(config, token, params)
      case 'update_contact_fields': return ghlUpdateContactFields(config, token, params)
      case 'add_tags':              return ghlAddTags(config, token, params)
      case 'remove_tags':           return ghlRemoveTags(config, token, params)
      case 'move_pipeline_stage':   return ghlMovePipelineStage(config, token, params)
      case 'create_note':           return ghlCreateNote(config, token, params)
    }
  }

  if (provider === 'custom') {
    switch (action) {
      case 'send_message': return customSendMessage(config, token, params)
    }
  }

  return { ok: false, status: 501, data: { error: `${provider}/${action} implementasyonu henüz yok` } }
}

// ── Main Handler ──────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const startMs = Date.now()

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const gatewaySecret = Deno.env.get('GATEWAY_SECRET') ?? ''

    // ── Auth: n8n secret kontrolü ─────────────────────────────
    const incomingSecret = req.headers.get('x-gateway-secret') ?? ''
    if (gatewaySecret && incomingSecret !== gatewaySecret) {
      return new Response(JSON.stringify({ error: 'Yetkisiz erişim' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const body = await req.json()
    const { version, action, clinic_id, correlation_id, idempotency_key, params = {} } = body

    // ── Validasyon ────────────────────────────────────────────
    if (!action || !clinic_id || !correlation_id) {
      return new Response(JSON.stringify(gatewayError('non_retryable', 'action, clinic_id ve correlation_id zorunlu')), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // ── Klinik bilgilerini çek ────────────────────────────────
    const { data: clinic, error: clinicErr } = await supabase
      .from('clinics')
      .select('id, crm_provider, crm_config, crm_token')
      .eq('id', clinic_id)
      .single()

    if (clinicErr || !clinic) {
      return new Response(JSON.stringify(gatewayError('non_retryable', 'Klinik bulunamadı')), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    const provider  = clinic.crm_provider || 'ghl'
    const config    = (clinic.crm_config  || {}) as Record<string, any>
    const token     = clinic.crm_token    || ''

    // ── Capability kontrolü ───────────────────────────────────
    const cap = CAPABILITIES[provider] ?? {}
    if (!cap[action]) {
      await logAction(supabase, {
        clinic_id, correlation_id, idempotency_key,
        provider, action, params,
        status: 'not_supported',
        error_type: 'not_supported',
        error_message: `${provider} provider'ı ${action} action'ını desteklemiyor`,
        duration_ms: Date.now() - startMs,
        provider_response: {},
      })
      return new Response(JSON.stringify({
        success: false,
        correlation_id,
        error_type: 'not_supported',
        error_message: `${provider} provider'ı ${action} action'ını desteklemiyor`,
        capabilities: cap,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // n8n fallback için 200 dön, içeriğe bak
      })
    }

    // ── Action çalıştır ───────────────────────────────────────
    const result = await executeAction(provider, action, config, token, params)
    const durationMs = Date.now() - startMs

    if (!result.ok) {
      const errorType = classifyHttpError(result.status ?? 500)
      await logAction(supabase, {
        clinic_id, correlation_id, idempotency_key,
        provider, action, params,
        status: 'failed',
        error_type: errorType,
        error_message: JSON.stringify(result.data),
        duration_ms: durationMs,
        provider_response: result.data,
      })
      return new Response(JSON.stringify({
        success: false,
        correlation_id,
        error_type: errorType,
        error_message: JSON.stringify(result.data),
        provider_status: result.status,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // ── Başarılı ─────────────────────────────────────────────
    await logAction(supabase, {
      clinic_id, correlation_id, idempotency_key,
      provider, action, params,
      status: 'success',
      duration_ms: durationMs,
      provider_response: result.data,
    })

    return new Response(JSON.stringify({
      success: true,
      correlation_id,
      data: result.data,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (err) {
    return new Response(JSON.stringify(gatewayError('retryable', (err as Error).message)), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

// ── Log helper ────────────────────────────────────────────────

async function logAction(supabase: any, data: {
  clinic_id: string
  correlation_id: string
  idempotency_key?: string
  provider: string
  action: string
  params: Record<string, unknown>
  status: string
  error_type?: string
  error_message?: string
  duration_ms: number
  provider_response: Record<string, unknown>
}) {
  await supabase.from('crm_action_logs').insert({
    clinic_id:         data.clinic_id,
    correlation_id:    data.correlation_id,
    idempotency_key:   data.idempotency_key,
    provider:          data.provider,
    action:            data.action,
    params:            data.params,
    status:            data.status,
    error_type:        data.error_type,
    error_message:     data.error_message,
    duration_ms:       data.duration_ms,
    provider_response: data.provider_response,
  })
}
