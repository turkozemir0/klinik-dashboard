import { NextRequest, NextResponse } from 'next/server'
import { createClient as sbAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { getValidToken } from '@/lib/calendar-token'

function getServiceClient() {
  return sbAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// GET — Org'un randevuları
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: orgUser } = await supabase
    .from('org_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!orgUser) return NextResponse.json({ error: 'No org' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const status          = searchParams.get('status')
  const source          = searchParams.get('source')
  const appointmentType = searchParams.get('appointment_type')
  const contactId       = searchParams.get('contact_id')
  const leadId          = searchParams.get('lead_id')
  const from            = searchParams.get('from')
  const to              = searchParams.get('to')
  const limit           = Math.min(Number(searchParams.get('limit') ?? '50'), 200)

  const service = getServiceClient()
  let query = service
    .from('appointments')
    .select('*, contacts(full_name, phone), leads(qualification_score, status)')
    .eq('organization_id', orgUser.organization_id)
    .order('scheduled_at', { ascending: true })
    .limit(limit)

  if (status)          query = query.eq('status', status)
  if (source)          query = query.eq('source', source)
  if (appointmentType) query = query.eq('appointment_type', appointmentType)
  if (contactId)       query = query.eq('contact_id', contactId)
  if (leadId)          query = query.eq('lead_id', leadId)
  if (from)            query = query.gte('scheduled_at', from)
  if (to)              query = query.lte('scheduled_at', to)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST — Yeni randevu oluştur
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: orgUser } = await supabase
    .from('org_users')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!orgUser) return NextResponse.json({ error: 'No org' }, { status: 403 })
  if (!['admin', 'yönetici', 'satisci'].includes(orgUser.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const {
    scheduled_at, contact_id, lead_id, conversation_id,
    duration_minutes, notes, metadata,
    title, appointment_type, source,
  } = body

  if (!scheduled_at) {
    return NextResponse.json({ error: 'scheduled_at zorunlu' }, { status: 400 })
  }

  const parsed = new Date(scheduled_at)
  if (isNaN(parsed.getTime())) {
    return NextResponse.json({ error: 'scheduled_at geçersiz tarih formatı' }, { status: 400 })
  }

  const VALID_TYPES   = ['consultation', 'operation', 'follow_up', 'other']
  const VALID_SOURCES = ['platform', 'ai', 'ghl', 'dentsoft']
  const apptType   = VALID_TYPES.includes(appointment_type)   ? appointment_type   : 'consultation'
  const apptSource = VALID_SOURCES.includes(source) ? source : 'platform'

  const service = getServiceClient()
  const { data: inserted, error } = await service
    .from('appointments')
    .insert({
      organization_id:  orgUser.organization_id,
      contact_id:       contact_id      ?? null,
      lead_id:          lead_id         ?? null,
      conversation_id:  conversation_id ?? null,
      scheduled_at:     parsed.toISOString(),
      duration_minutes: Number(duration_minutes ?? 60),
      notes:            notes            ?? null,
      metadata:         metadata         ?? {},
      status:           'scheduled',
      title:            title            ?? null,
      appointment_type: apptType,
      source:           apptSource,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto-push to calendar providers (fire-and-forget)
  pushToGoogleCalendar(inserted, orgUser.organization_id, parsed, duration_minutes ?? 60, notes, title, contact_id)
    .catch(err => console.warn('[calendar] Google push failed:', err))
  pushToDentsoft(inserted, orgUser.organization_id, parsed, title, contact_id)
    .catch(err => console.warn('[calendar] DentSoft push failed:', err))

  return NextResponse.json(inserted, { status: 201 })
}

// ── Google Calendar push helper ────────────────────────────────────────────────

async function pushToGoogleCalendar(
  appointment: any,
  orgId: string,
  scheduledAt: Date,
  durationMinutes: number,
  notes: string | undefined,
  title: string | undefined,
  contactId: string | undefined,
) {
  try {
    // Use service client to get org calendar config directly
    const service = getServiceClient()
    const { data: org } = await service
      .from('organizations')
      .select('channel_config')
      .eq('id', orgId)
      .single()

    const cal = (org?.channel_config as any)?.calendar
    if (!cal || cal.provider !== 'google' || !cal.access_token) return

    const token = await getValidToken(orgId, cal)
    if (!token) return

    // Get contact name if available
    let contactName = title ?? 'Randevu'
    if (contactId) {
      const { data: contact } = await service
        .from('contacts').select('full_name').eq('id', contactId).single()
      if (contact?.full_name) contactName = contact.full_name
    }

    const endAt = new Date(scheduledAt.getTime() + durationMinutes * 60_000)
    const event: any = {
      summary:     title ?? contactName,
      start:       { dateTime: scheduledAt.toISOString(), timeZone: 'Europe/Istanbul' },
      end:         { dateTime: endAt.toISOString(),       timeZone: 'Europe/Istanbul' },
      description: [notes, `[stoaix:appointment_id:${appointment.id}]`].filter(Boolean).join('\n'),
    }

    const calId = encodeURIComponent(cal.calendar_id || 'primary')
    const createRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calId}/events`,
      {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify(event),
      }
    )

    if (createRes.ok) {
      const gcalEvent = await createRes.json()
      // Store gcal event ID back on the appointment
      await service
        .from('appointments')
        .update({ external_id: gcalEvent.id })
        .eq('id', appointment.id)
    } else {
      console.warn('[calendar] Google Calendar event creation failed:', await createRes.text())
    }
  } catch (err) {
    console.warn('[calendar] pushToGoogleCalendar error:', err)
  }
}

// ── DentSoft push helper ──────────────────────────────────────────────────────

async function pushToDentsoft(
  appointment: any,
  orgId: string,
  scheduledAt: Date,
  title: string | undefined,
  contactId: string | undefined,
) {
  try {
    const service = getServiceClient()
    const { data: org } = await service
      .from('organizations')
      .select('channel_config')
      .eq('id', orgId)
      .single()

    const cal = (org?.channel_config as any)?.calendar
    if (!cal || cal.provider !== 'dentsoft' || !cal.api_url || !cal.api_key || !cal.clinic_id) return

    const doctorId = cal.default_doctor_id
    if (!doctorId) return

    // Get contact info for the appointment
    let contactName = title ?? 'Randevu'
    let contactPhone = ''
    if (contactId) {
      const { data: contact } = await service
        .from('contacts').select('full_name, phone').eq('id', contactId).single()
      if (contact?.full_name) contactName = contact.full_name
      if (contact?.phone) contactPhone = contact.phone
    }

    const baseUrl = cal.api_url.replace(/\/+$/, '')
    const fd = new FormData()
    fd.append('FullName', contactName)
    fd.append('ContactMobile', contactPhone)
    fd.append('Date', scheduledAt.toISOString().slice(0, 10))
    fd.append('Time', scheduledAt.toISOString().slice(11, 16))
    fd.append('Note', title ?? '')
    fd.append('PatientNumber', '')

    const dsRes = await fetch(
      `${baseUrl}/Api/v1/Appointment/New/${encodeURIComponent(cal.clinic_id)}/${encodeURIComponent(doctorId)}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${cal.api_key}` },
        body: fd,
      }
    )

    if (dsRes.ok) {
      const dsData = await dsRes.json()
      if (dsData?.Status?.Code === 100) {
        const externalId = dsData?.Response?.PNR ?? dsData?.Response?.AppointmentID ?? dsData?.Response?.ID
        if (externalId) {
          await service
            .from('appointments')
            .update({ external_id: String(externalId) })
            .eq('id', appointment.id)
        }
      }
    } else {
      console.warn('[calendar] DentSoft appointment creation failed:', await dsRes.text())
    }
  } catch (err) {
    console.warn('[calendar] pushToDentsoft error:', err)
  }
}
