/**
 * Generic Calendar Adapter
 *
 * Factory: getCalendarAdapter(org) → doğru provider otomatik seçilir.
 *
 * Providers:
 *   google   → GoogleCalendarAdapter  (channel_config.calendar)
 *   dentsoft → DentsoftCalendarAdapter (Bearer token auth, per-clinic base URL)
 *   ghl      → GHLCalendarAdapter     (crm_config.calendar_id + pit_token — legacy)
 *   none     → null
 */

// ─── Shared types ──────────────────────────────────────────────────────────────

export interface SlotGroup {
  date: string     // Formatted label, e.g. "Salı (2026-04-14)"
  times: string[]  // e.g. ["09:00", "10:30", "14:00"]
}

export interface AppointmentParams {
  name:       string
  phone:      string
  datetime:   string   // ISO 8601, e.g. "2026-04-14T10:00:00"
  notes?:     string
  email?:     string
  tckn?:      string   // TC Kimlik No — DentSoft uses this for patient matching
}

export interface AppointmentResult {
  success:          boolean
  appointment_id?:  string
  error?:           string
}

export interface CalendarAdapter {
  getFreeSlots(days?: number): Promise<SlotGroup[]>
  createAppointment(params: AppointmentParams): Promise<AppointmentResult>
}

// ─── GHL Adapter (legacy) ─────────────────────────────────────────────────────

export class GHLCalendarAdapter implements CalendarAdapter {
  constructor(
    private calendarId: string,
    private pitToken:   string
  ) {}

  async getFreeSlots(days = 3): Promise<SlotGroup[]> {
    try {
      const now     = new Date()
      const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
      const start   = now.toISOString().slice(0, 10)
      const end     = endDate.toISOString().slice(0, 10)

      const url =
        `https://services.leadconnectorhq.com/calendars/${this.calendarId}/free-slots` +
        `?startDate=${start}&endDate=${end}&timezone=Europe%2FIstanbul`

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.pitToken}`,
          Version: '2021-04-15',
          Accept: 'application/json',
        },
      })
      if (!res.ok) return []

      const data  = await res.json()
      const slots = data.slots ?? {}

      const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
      return Object.entries(slots as Record<string, string[]>)
        .filter(([, times]) => times?.length > 0)
        .map(([date, times]) => {
          const d       = new Date(date + 'T00:00:00')
          const dayName = DAYS[d.getDay()]
          return { date: `${dayName} (${date})`, times: times.slice(0, 5) }
        })
    } catch {
      return []
    }
  }

  async createAppointment(params: AppointmentParams): Promise<AppointmentResult> {
    try {
      const res = await fetch('https://services.leadconnectorhq.com/calendars/events/appointments', {
        method: 'POST',
        headers: {
          Authorization:   `Bearer ${this.pitToken}`,
          Version:         '2021-04-15',
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          calendarId:         this.calendarId,
          selectedTimezone:   'Europe/Istanbul',
          startTime:          params.datetime,
          title:              `Randevu — ${params.name}`,
          appointmentStatus:  'confirmed',
          notes:              params.notes ?? '',
          contactName:        params.name,
          phone:              params.phone,
          ...(params.email ? { email: params.email } : {}),
        }),
      })
      if (!res.ok) {
        const err = await res.text()
        return { success: false, error: err }
      }
      const data = await res.json()
      return { success: true, appointment_id: data?.id }
    } catch (e: any) {
      return { success: false, error: String(e) }
    }
  }
}

// ─── Google Calendar Adapter ──────────────────────────────────────────────────

interface GoogleCalConfig {
  calendar_id?:  string
  access_token:  string
}

export class GoogleCalendarAdapter implements CalendarAdapter {
  constructor(private config: GoogleCalConfig) {}

  async getFreeSlots(_days = 3): Promise<SlotGroup[]> {
    // Google Calendar doesn't expose a simple "available slots" API.
    // Free/busy API shows *busy* periods, not available slots.
    // Voice-agent use: not suitable without a scheduling layer.
    // Dashboard events UI is handled via /api/calendar/events route directly.
    return []
  }

  async createAppointment(params: AppointmentParams): Promise<AppointmentResult> {
    try {
      const calId  = encodeURIComponent(this.config.calendar_id || 'primary')
      const endDt  = new Date(new Date(params.datetime).getTime() + 60 * 60 * 1000).toISOString()

      const event: Record<string, unknown> = {
        summary:     `Randevu — ${params.name}`,
        description: params.notes ?? '',
        start:       { dateTime: params.datetime, timeZone: 'Europe/Istanbul' },
        end:         { dateTime: endDt,            timeZone: 'Europe/Istanbul' },
      }
      if (params.email) event.attendees = [{ email: params.email }]

      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calId}/events`,
        {
          method: 'POST',
          headers: {
            Authorization:  `Bearer ${this.config.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      )
      if (!res.ok) {
        const err = await res.text()
        return { success: false, error: err }
      }
      const data = await res.json()
      return { success: true, appointment_id: data?.id }
    } catch (e: any) {
      return { success: false, error: String(e) }
    }
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

interface OrgRow {
  crm_config?:     Record<string, any>
  channel_config?: Record<string, any>
}

/**
 * Returns the appropriate CalendarAdapter for the org, or null if none configured.
 *
 * Resolution order:
 * 1. channel_config.calendar.provider = 'google'    → GoogleCalendarAdapter
 * 2. channel_config.calendar.provider = 'dentsoft'  → DentsoftCalendarAdapter
 * 3. crm_config.calendar_id + pit_token present     → GHLCalendarAdapter (legacy)
 * 4. otherwise → null
 */
export function getCalendarAdapter(org: OrgRow): CalendarAdapter | null {
  const channelConfig = org.channel_config ?? {}
  const calConfig     = channelConfig.calendar ?? {}
  const provider      = calConfig.provider ?? 'none'

  if (provider === 'google') {
    if (!calConfig.access_token) return null
    return new GoogleCalendarAdapter(calConfig)
  }

  if (provider === 'dentsoft') {
    const { DentsoftCalendarAdapter } = await import('./dentsoft-adapter.ts')
    if (!calConfig.api_url || !calConfig.api_key || !calConfig.clinic_id) return null
    return new DentsoftCalendarAdapter(calConfig)
  }

  // Legacy GHL: crm_config.calendar_id + crm_config.pit_token
  const crmConfig  = org.crm_config ?? {}
  const calendarId = crmConfig.calendar_id ?? ''
  const pitToken   = crmConfig.pit_token ?? ''
  if (calendarId && pitToken) {
    return new GHLCalendarAdapter(calendarId, pitToken)
  }

  return null
}
