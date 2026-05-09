import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { checkEntitlement } from '@/lib/entitlements'
import { hashContactPii, buildCapiPayload, sendCapiEvent } from '@/lib/meta-capi'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(req: NextRequest) {
  const server = createServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: orgUser } = await server
    .from('org_users')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!orgUser || !['admin', 'patron', 'yönetici', 'satisci'].includes(orgUser.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const orgId = orgUser.organization_id

  const ent = await checkEntitlement(orgId, 'meta_capi')
  if (!ent.enabled) return NextResponse.json({ error: 'Feature not available' }, { status: 403 })

  const body = await req.json()
  const { lead_id, event_name } = body

  if (!lead_id || !event_name)
    return NextResponse.json({ error: 'lead_id and event_name required' }, { status: 400 })

  const validEvents = ['Lead', 'CompleteRegistration', 'Schedule']
  if (!validEvents.includes(event_name))
    return NextResponse.json({ error: `event_name must be one of: ${validEvents.join(', ')}` }, { status: 400 })

  const sb = getServiceClient()

  // Get CAPI config
  const { data: org } = await sb
    .from('organizations')
    .select('channel_config')
    .eq('id', orgId)
    .single()

  const capiConfig = org?.channel_config?.meta_capi
  if (!capiConfig?.active || !capiConfig.pixel_id || !capiConfig.access_token)
    return NextResponse.json({ error: 'CAPI not configured' }, { status: 400 })

  // Dedup check — same lead+event in last 24h
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: existing } = await sb
    .from('crm_sync_logs')
    .select('id')
    .eq('organization_id', orgId)
    .eq('entity_type', 'capi_event')
    .eq('entity_id', lead_id)
    .eq('action', event_name)
    .gte('created_at', twentyFourHoursAgo)
    .limit(1)

  if (existing && existing.length > 0)
    return NextResponse.json({ error: 'already_sent', message: 'Bu olay son 24 saat içinde zaten bildirildi' }, { status: 409 })

  // Get lead + contact data
  const { data: lead } = await sb
    .from('leads')
    .select('id, contact:contacts(email, phone, full_name)')
    .eq('id', lead_id)
    .eq('organization_id', orgId)
    .single()

  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  const contact = lead.contact as any
  const userData = hashContactPii({
    email: contact?.email,
    phone: contact?.phone,
    full_name: contact?.full_name,
  })

  if (Object.keys(userData).length === 0)
    return NextResponse.json({ error: 'No PII available for this lead' }, { status: 400 })

  const eventTime = Math.floor(Date.now() / 1000)
  const eventId = `lead_${lead_id}_${event_name}_${eventTime}`

  const payload = buildCapiPayload({
    eventName: event_name,
    eventTime,
    eventId,
    userData,
    customData: { lead_id },
  })

  const result = await sendCapiEvent(capiConfig.pixel_id, capiConfig.access_token, payload)

  // Log to crm_sync_logs
  await sb.from('crm_sync_logs').insert({
    organization_id: orgId,
    entity_type: 'capi_event',
    entity_id: lead_id,
    action: event_name,
    provider: 'meta',
    status: result.success ? 'success' : 'failed',
    response_data: result,
  })

  if (!result.success)
    return NextResponse.json({ error: 'CAPI send failed', detail: result.error }, { status: 502 })

  return NextResponse.json({ success: true, events_received: result.events_received })
}
