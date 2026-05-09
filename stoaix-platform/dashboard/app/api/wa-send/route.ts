import { NextRequest, NextResponse } from 'next/server'
import { createClient as sbAdmin } from '@supabase/supabase-js'
import { checkEntitlement, incrementUsage } from '@/lib/entitlements'
import { generateMessage, resolveLanguage, type WaScenario } from '@/lib/wa-message-generator'

function getServiceClient() {
  return sbAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

const VALID_SCENARIOS: WaScenario[] = [
  'first_contact', 'followup', 'appointment_confirm', 'appointment_reminder',
  'satisfaction_survey', 'reactivation', 'payment_followup', 'call_fallback',
]

// POST — n8n → AI mesaj üret → WasenderAPI gönder → DB kaydet
export async function POST(request: NextRequest) {
  // 1. Secret doğrula
  const secret = request.headers.get('x-internal-secret')
  const expectedSecret = process.env.WORKFLOW_INTERNAL_SECRET
  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { org_id, phone, run_id, scenario, contact_data } = body ?? {}

  if (!org_id || !phone || !scenario) {
    return NextResponse.json({ error: 'org_id, phone, scenario zorunlu' }, { status: 400 })
  }
  if (!VALID_SCENARIOS.includes(scenario)) {
    return NextResponse.json({ error: `Geçersiz scenario: ${scenario}` }, { status: 400 })
  }

  const service = getServiceClient()

  // 2. Org fetch
  const { data: org } = await service
    .from('organizations')
    .select('id, name, sector, default_language, channel_config, ai_persona')
    .eq('id', org_id)
    .maybeSingle()

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  // 3. WasenderAPI credentials
  const channelConfig = (org.channel_config ?? {}) as any
  const waProvider = channelConfig?.whatsapp?.provider
  const creds = channelConfig?.whatsapp?.credentials

  if (waProvider !== 'wasender' || !creds?.api_key) {
    return NextResponse.json({ error: 'WasenderAPI yapılandırılmamış' }, { status: 400 })
  }

  // 4. Entitlement check
  const ent = await checkEntitlement(org_id, 'whatsapp_outbound')
  if (!ent.enabled) {
    return NextResponse.json({ error: 'upgrade_required', feature: 'whatsapp_outbound' }, { status: 403 })
  }
  if (ent.remaining !== null && ent.remaining <= 0) {
    return NextResponse.json({ error: 'usage_limit_exceeded', feature: 'whatsapp_outbound' }, { status: 403 })
  }

  // 5. Dil çözümle + mesaj üret
  const language = resolveLanguage(contact_data ?? {}, org)

  const message = await generateMessage({
    scenario,
    language,
    contact_data: contact_data ?? {},
    org: {
      name: org.name,
      sector: org.sector,
      ai_persona: org.ai_persona as any,
    },
  })

  // 6. WasenderAPI gönder
  const waId = (phone ?? '').replace(/^\+/, '')
  let wasenderMsgId: string | null = null

  try {
    const res = await fetch('https://www.wasenderapi.com/api/send-message', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${creds.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to: waId, text: message }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error(`[wa-send] WasenderAPI send failed ${res.status}: ${errText}`)
      return NextResponse.json({ success: false, error: 'WasenderAPI gönderim hatası', provider: 'wasender' }, { status: 502 })
    }

    try {
      const resBody = await res.json()
      wasenderMsgId = resBody?.data?.key?.id ?? null
    } catch { /* ignore parse errors */ }
  } catch (err) {
    console.error('[wa-send] WasenderAPI request failed:', err)
    return NextResponse.json({ success: false, error: 'WasenderAPI bağlantı hatası', provider: 'wasender' }, { status: 502 })
  }

  // 7. DB'ye kaydet — conversation bul veya oluştur → message insert
  try {
    // Contact bul (phone ile)
    const { data: contact } = await service
      .from('contacts')
      .select('id')
      .eq('organization_id', org_id)
      .eq('phone', phone)
      .maybeSingle()

    const contactId = contact?.id ?? null

    // Mevcut conversation bul veya oluştur
    let conversationId: string | null = null

    if (contactId) {
      const { data: existingConv } = await service
        .from('conversations')
        .select('id')
        .eq('organization_id', org_id)
        .eq('contact_id', contactId)
        .eq('channel', 'whatsapp')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existingConv) {
        conversationId = existingConv.id
      } else {
        const { data: newConv } = await service
          .from('conversations')
          .insert({
            organization_id: org_id,
            contact_id: contactId,
            channel: 'whatsapp',
            status: 'active',
          })
          .select('id')
          .single()
        conversationId = newConv?.id ?? null
      }
    }

    if (conversationId) {
      await service
        .from('messages')
        .insert({
          conversation_id: conversationId,
          organization_id: org_id,
          role: 'assistant',
          content: message,
          channel: 'whatsapp',
          ...(wasenderMsgId ? { external_id: wasenderMsgId } : {}),
        })
    }
  } catch (err) {
    // DB save failure shouldn't fail the entire request — message was already sent
    console.error('[wa-send] DB save error:', err)
  }

  // 8. Usage increment
  await incrementUsage(org_id, 'whatsapp_outbound')

  return NextResponse.json({
    success: true,
    provider: 'wasender',
    message_id: wasenderMsgId,
    scenario,
    language,
  })
}
