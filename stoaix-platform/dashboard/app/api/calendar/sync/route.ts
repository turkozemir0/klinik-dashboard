import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as sbAdmin } from '@supabase/supabase-js'
import { checkEntitlement } from '@/lib/entitlements'
import { getValidToken, getOrgCalendar, updateLastSynced } from '@/lib/calendar-token'

function getServiceClient() {
  return sbAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// POST — Sync Google Calendar → appointments table
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await getOrgCalendar(user.id)
  if (!result) return NextResponse.json({ error: 'Org bulunamadı' }, { status: 404 })

  const { orgId, cal } = result

  const ent = await checkEntitlement(orgId, 'calendar_manage')
  if (!ent.enabled) return NextResponse.json({ error: 'upgrade_required', feature: 'calendar_manage' }, { status: 403 })

  // Support both provider:'google' and legacy configs (access_token present but no provider field)
  const provider = cal?.provider ?? (cal?.access_token ? 'google' : 'none')
  if (provider !== 'google' || !cal?.access_token) {
    return NextResponse.json({ error: 'Google Takvim bağlı değil' }, { status: 400 })
  }

  const token = await getValidToken(orgId, cal)
  if (!token) return NextResponse.json({ error: 'Token yenilenemedi' }, { status: 401 })

  // Fetch last 60 days + next 90 days of events from Google Calendar
  const timeMin = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  const timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
  const calId   = encodeURIComponent(cal.calendar_id || 'primary')

  const gcalRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calId}/events?` +
    new URLSearchParams({
      timeMin,
      timeMax,
      maxResults:   '250',
      singleEvents: 'true',
      orderBy:      'startTime',
    }),
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!gcalRes.ok) {
    const errText = await gcalRes.text()
    console.error('[calendar/sync] Google API error:', errText)
    return NextResponse.json({ error: errText }, { status: gcalRes.status })
  }

  const gcalData = await gcalRes.json()
  const items: any[] = gcalData.items ?? []

  const service = getServiceClient()
  let synced  = 0
  let skipped = 0
  const errors: string[] = []

  for (const event of items) {
    try {
      if (!event.id) { skipped++; continue }

      const isCancelled = event.status === 'cancelled'

      const startRaw: string | undefined = event.start?.dateTime ?? event.start?.date
      if (!startRaw) { skipped++; continue }

      // Normalize to ISO datetime string
      const scheduledAt = startRaw.includes('T')
        ? new Date(startRaw).toISOString()
        : new Date(`${startRaw}T09:00:00`).toISOString()

      const endRaw: string | undefined = event.end?.dateTime ?? event.end?.date
      let durationMinutes = 60
      if (endRaw) {
        const endDt   = new Date(endRaw.includes('T') ? endRaw : `${endRaw}T09:00:00`)
        const startDt = new Date(scheduledAt)
        durationMinutes = Math.max(15, Math.round((endDt.getTime() - startDt.getTime()) / 60_000))
      }

      const desc      = event.description ?? ''
      const leadMatch = desc.match(/\[stoaix:lead_id:([a-f0-9-]{36})\]/i)
      const leadId    = leadMatch ? leadMatch[1] : null

      // Check if this Google event maps to an existing platform appointment
      const apptMatch     = desc.match(/\[stoaix:appointment_id:([a-f0-9-]{36})\]/i)
      const existingApptId = apptMatch ? apptMatch[1] : null

      // Try to match contact by attendee email (best-effort)
      let contactId: string | null = null
      const attendees: any[] = event.attendees ?? []
      for (const att of attendees) {
        if (!att.email || att.self) continue
        const { data: contact } = await service
          .from('contacts')
          .select('id')
          .eq('organization_id', orgId)
          .eq('email', att.email)
          .maybeSingle()
        if (contact) { contactId = contact.id; break }
      }

      const now = new Date().toISOString()

      if (existingApptId) {
        // Link existing platform appointment to this Google event
        await service.from('appointments')
          .update({ external_id: event.id, updated_at: now })
          .eq('id', existingApptId)
          .eq('organization_id', orgId)
        synced++
        continue
      }

      // Explicit select → insert or update (avoids partial-index upsert issue)
      const { data: existing } = await service
        .from('appointments')
        .select('id')
        .eq('organization_id', orgId)
        .eq('source', 'google')
        .eq('external_id', event.id)
        .maybeSingle()

      const payload = {
        organization_id:  orgId,
        source:           'google',
        external_id:      event.id,
        title:            event.summary ?? null,
        notes:            desc.replace(/\[stoaix:[^\]]+\]/g, '').trim() || null,
        scheduled_at:     scheduledAt,
        duration_minutes: durationMinutes,
        appointment_type: 'consultation',
        status:           isCancelled ? 'cancelled' : 'confirmed',
        contact_id:       contactId,
        lead_id:          leadId,
        updated_at:       now,
      }

      if (existing) {
        const { error: updateErr } = await service
          .from('appointments')
          .update(payload)
          .eq('id', existing.id)
        if (updateErr) errors.push(`update event ${event.id}: ${updateErr.message}`)
        else synced++
      } else {
        const { error: insertErr } = await service
          .from('appointments')
          .insert({ ...payload, metadata: {} })
        if (insertErr) errors.push(`insert event ${event.id}: ${insertErr.message}`)
        else synced++
      }
    } catch (err: any) {
      errors.push(`event ${event.id ?? '?'}: ${err.message}`)
    }
  }

  if (errors.length) console.warn('[calendar/sync] Errors:', errors)

  const lastSyncedAt = await updateLastSynced(orgId, cal)
  return NextResponse.json({ synced, skipped, errors, last_synced_at: lastSyncedAt })
}
