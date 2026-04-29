import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as sbAdmin } from '@supabase/supabase-js'
import { checkEntitlement, incrementUsage } from '@/lib/entitlements'

function getServiceClient() {
  return sbAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}
import { demoWriteBlock } from '@/lib/demo-guard'
import * as Sentry from '@sentry/nextjs'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_CONTENT_LEN = 4096
// Roles that are not allowed to send messages on behalf of the org
const SEND_BLOCKED_ROLES = ['muhasebe']

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek gövdesi' }, { status: 400 })
  }

  const { conversationId, content } = body ?? {}

  if (!conversationId || !content?.trim()) {
    return NextResponse.json({ error: 'conversationId ve content zorunlu' }, { status: 400 })
  }
  if (!UUID_RE.test(conversationId)) {
    return NextResponse.json({ error: 'Geçersiz conversationId' }, { status: 400 })
  }
  if (content.trim().length > MAX_CONTENT_LEN) {
    return NextResponse.json({ error: `Mesaj en fazla ${MAX_CONTENT_LEN} karakter olabilir` }, { status: 400 })
  }

  const service = getServiceClient()

  // Fetch conversation
  const { data: conv } = await service
    .from('conversations')
    .select('id, channel, organization_id, contact_id, mode')
    .eq('id', conversationId)
    .maybeSingle()
  if (!conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })

  const blocked = demoWriteBlock(conv.organization_id)
  if (blocked) return blocked

  // Auth + role check
  const { data: orgUser } = await service
    .from('org_users')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (orgUser) {
    if (orgUser.organization_id !== conv.organization_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (SEND_BLOCKED_ROLES.includes(orgUser.role)) {
      return NextResponse.json({ error: 'Bu rol için mesaj gönderme yetkisi yok' }, { status: 403 })
    }
  } else {
    const { data: sa } = await service
      .from('super_admin_users')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!sa) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (conv.channel === 'voice') {
    return NextResponse.json({ error: 'Ses konuşmalarına yanıt gönderilemez' }, { status: 400 })
  }

  // Feature gate: kanal bazlı
  const featureKey = conv.channel === 'instagram' ? 'instagram_dm' : 'whatsapp_outbound'
  const ent = await checkEntitlement(conv.organization_id, featureKey)
  if (!ent.enabled) return NextResponse.json({ error: 'upgrade_required', feature: featureKey }, { status: 403 })
  if (ent.remaining !== null && ent.remaining <= 0) {
    return NextResponse.json({ error: 'usage_limit_exceeded', feature: featureKey, limit: ent.limit, used: ent.used }, { status: 403 })
  }

  // Fetch org channel_config
  const { data: org } = await service
    .from('organizations')
    .select('channel_config')
    .eq('id', conv.organization_id)
    .maybeSingle()
  const channelConfig = (org?.channel_config ?? {}) as any

  // Fetch contact
  const { data: contact } = await service
    .from('contacts')
    .select('id, phone, channel_identifiers')
    .eq('id', conv.contact_id)
    .maybeSingle()
  if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })

  const text = content.trim()

  if (conv.channel === 'whatsapp') {
    const waProvider = channelConfig?.whatsapp?.provider ?? '360dialog'
    const creds = channelConfig?.whatsapp?.credentials
    const waId = (contact.phone ?? '').replace(/^\+/, '')
    if (!waId) return NextResponse.json({ error: 'Telefon numarası bulunamadı' }, { status: 400 })

    if (waProvider === 'whatsapp_cloud') {
      if (!creds?.access_token || !creds?.phone_number_id) {
        return NextResponse.json({ error: 'WhatsApp Cloud credentials eksik' }, { status: 400 })
      }
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${creds.phone_number_id}/messages`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${creds.access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ messaging_product: 'whatsapp', to: waId, type: 'text', text: { body: text } }),
        }
      )
      if (!res.ok) {
        const errText = await res.text()
        console.error(`[inbox/reply] Meta WA send failed ${res.status}: ${errText}`)
        return NextResponse.json({ error: 'Mesaj gönderilemedi' }, { status: 502 })
      }
    } else {
      // 360dialog (default)
      if (!creds?.client_token) {
        return NextResponse.json({ error: '360dialog credentials eksik' }, { status: 400 })
      }
      const res = await fetch('https://waba.360dialog.io/v1/messages', {
        method: 'POST',
        headers: { 'D360-API-KEY': creds.client_token, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: waId,
          type: 'text',
          text: { body: text },
        }),
      })
      if (!res.ok) {
        const errText = await res.text()
        console.error(`[inbox/reply] 360dialog send failed ${res.status}: ${errText}`)
        return NextResponse.json({ error: 'Mesaj gönderilemedi' }, { status: 502 })
      }
    }

  } else if (conv.channel === 'instagram') {
    const igCreds = channelConfig?.instagram?.credentials
    if (!igCreds?.access_token || !igCreds?.fb_page_id) {
      return NextResponse.json({ error: 'Instagram config eksik' }, { status: 400 })
    }
    const recipientId = (contact.channel_identifiers as any)?.instagram_id
    if (!recipientId) return NextResponse.json({ error: 'Instagram ID bulunamadı' }, { status: 400 })

    const res = await fetch(`https://graph.facebook.com/v19.0/${igCreds.fb_page_id}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${igCreds.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient: { id: recipientId }, message: { text }, messaging_type: 'RESPONSE' }),
    })
    if (!res.ok) {
      const errText = await res.text()
      console.error(`[inbox/reply] Instagram send failed ${res.status}: ${errText}`)
      return NextResponse.json({ error: 'Mesaj gönderilemedi' }, { status: 502 })
    }

  } else {
    return NextResponse.json({ error: `Bilinmeyen kanal: ${conv.channel}` }, { status: 400 })
  }

  // Save message to DB
  const { data: newMsg, error: insertErr } = await service
    .from('messages')
    .insert({
      conversation_id: conversationId,
      organization_id: conv.organization_id,
      role: 'assistant',
      content: text,
      channel: conv.channel,
    })
    .select('id, role, content, created_at')
    .single()

  if (insertErr) {
    Sentry.captureException(insertErr, { extra: { conversationId, route: 'inbox/reply' } })
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  await incrementUsage(conv.organization_id, featureKey)
  return NextResponse.json({ message: newMsg })
}
