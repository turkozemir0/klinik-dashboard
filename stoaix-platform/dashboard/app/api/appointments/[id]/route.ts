import { NextRequest, NextResponse } from 'next/server'
import { createClient as sbAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { getValidToken } from '@/lib/calendar-token'

function getServiceClient() {
  return sbAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// PATCH — Randevu güncelle (status, title, appointment_type, notes, scheduled_at)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
  const { status, notes, scheduled_at, title, appointment_type } = body

  const VALID_STATUSES = ['scheduled', 'confirmed', 'attended', 'no_show', 'cancelled', 'rescheduled']
  const VALID_TYPES    = ['consultation', 'operation', 'follow_up', 'other']

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({
      error: `Geçersiz status. Geçerli değerler: ${VALID_STATUSES.join(', ')}`,
    }, { status: 400 })
  }
  if (appointment_type !== undefined && !VALID_TYPES.includes(appointment_type)) {
    return NextResponse.json({
      error: `Geçersiz appointment_type. Geçerli değerler: ${VALID_TYPES.join(', ')}`,
    }, { status: 400 })
  }

  // Require at least one field
  if (status === undefined && notes === undefined && scheduled_at === undefined &&
      title === undefined && appointment_type === undefined) {
    return NextResponse.json({ error: 'Güncellenecek alan yok' }, { status: 400 })
  }

  const now = new Date().toISOString()
  const updates: Record<string, any> = { updated_at: now }

  if (status !== undefined) {
    updates.status = status
    if (status === 'attended')  updates.attended_at  = now
    if (status === 'no_show')   updates.no_show_at   = now
    if (status === 'confirmed') updates.confirmed_at = now
  }
  if (notes !== undefined)            updates.notes            = notes
  if (scheduled_at !== undefined)     updates.scheduled_at     = scheduled_at
  if (title !== undefined)            updates.title            = title
  if (appointment_type !== undefined) updates.appointment_type = appointment_type

  const service = getServiceClient()
  const { data, error } = await service
    .from('appointments')
    .update(updates)
    .eq('id', params.id)
    .eq('organization_id', orgUser.organization_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Randevu bulunamadı' }, { status: 404 })

  // Sync to Google Calendar if appointment has an external_id and source != 'google'
  if (data.external_id && data.source !== 'google') {
    syncToGoogle(data, orgUser.organization_id, status, scheduled_at, title, notes)
      .catch(err => console.warn('[calendar] Google sync failed:', err))
  }

  return NextResponse.json(data)
  // Note: pg_net trigger on appointments.status UPDATE automatically fires
  // appointment_noshow or post_appointment workflow events
}

// ── Google Calendar sync helper ────────────────────────────────────────────────

async function syncToGoogle(
  appointment: any,
  orgId: string,
  newStatus: string | undefined,
  newScheduledAt: string | undefined,
  newTitle: string | undefined,
  newNotes: string | undefined,
) {
  try {
    const service = getServiceClient()
    const { data: org } = await service
      .from('organizations').select('channel_config').eq('id', orgId).single()

    const cal = (org?.channel_config as any)?.calendar
    const provider = cal?.provider ?? (cal?.access_token ? 'google' : 'none')
    if (provider !== 'google' || !cal?.access_token) return

    const token = await getValidToken(orgId, cal)
    if (!token) return

    const calId   = encodeURIComponent(cal.calendar_id || 'primary')
    const eventId = appointment.external_id

    if (newStatus === 'cancelled') {
      await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calId}/events/${eventId}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      )
      return
    }

    // Build PATCH payload for any field updates
    const patch: Record<string, any> = {}

    if (newTitle !== undefined)   patch.summary     = newTitle
    if (newNotes !== undefined)   patch.description = newNotes

    if (newScheduledAt) {
      const parsed = new Date(newScheduledAt)
      const endAt  = new Date(parsed.getTime() + (appointment.duration_minutes ?? 60) * 60_000)
      patch.start = { dateTime: parsed.toISOString(), timeZone: 'Europe/Istanbul' }
      patch.end   = { dateTime: endAt.toISOString(),  timeZone: 'Europe/Istanbul' }
    }

    if (Object.keys(patch).length === 0) return

    await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calId}/events/${eventId}`,
      {
        method:  'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify(patch),
      }
    )
  } catch (err) {
    console.warn('[calendar] syncToGoogle error:', err)
  }
}

// GET — Tek randevu
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: orgUser } = await supabase
    .from('org_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!orgUser) return NextResponse.json({ error: 'No org' }, { status: 403 })

  const service = getServiceClient()
  const { data, error } = await service
    .from('appointments')
    .select('*, contacts(full_name, phone)')
    .eq('id', params.id)
    .eq('organization_id', orgUser.organization_id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
  return NextResponse.json(data)
}
