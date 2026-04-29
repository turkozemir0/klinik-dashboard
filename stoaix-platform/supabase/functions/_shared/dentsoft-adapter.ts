/**
 * DentSoft Calendar Adapter
 *
 * API: Bearer Token auth, Base URL per-clinic
 * Endpoints:
 *   GET  /Api/v1/Doctor/OnlineWork — boş slot çekme
 *   POST /Api/v1/Appointment/New/{ClinicID}/{UserID} — randevu oluşturma (multipart/form-data)
 *   POST /Api/v1/Appointment/Cancel — randevu iptal
 *   GET  /Api/v1/Doctor/List?ClinicID=... — hekim listesi
 *   GET  /Api/v1/Patient/ClinicInfo?ContactMobile=... — hasta arama
 *
 * Response format: { Status: { Code: 100, Message: "Success" }, Response: {...}, Error: [] }
 */

import type { CalendarAdapter, AppointmentParams, AppointmentResult, SlotGroup } from './calendar-adapter.ts'

export interface DentsoftConfig {
  api_url:            string
  api_key:            string
  clinic_id:          string
  default_doctor_id?: string
  doctors?:           { id: string; name: string }[]
}

// ── Helper: DentSoft fetch ──────────────────────────────────────────────────

async function dentsoftFetch(
  config: DentsoftConfig,
  path: string,
  options?: { method?: string; formData?: FormData; params?: Record<string, string> }
): Promise<{ ok: boolean; data?: any; error?: string }> {
  const baseUrl = config.api_url.replace(/\/+$/, '')
  const method  = options?.method ?? 'GET'

  let url = `${baseUrl}${path}`
  if (options?.params) {
    const qs = new URLSearchParams(options.params).toString()
    url += (url.includes('?') ? '&' : '?') + qs
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.api_key}`,
    Accept:        'application/json',
  }

  const fetchInit: RequestInit = { method, headers }
  if (options?.formData) {
    fetchInit.body = options.formData
    // Don't set Content-Type — browser/runtime will set multipart boundary
  }

  try {
    const res = await fetch(url, fetchInit)
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}: ${await res.text()}` }
    }
    const json = await res.json()
    if (json?.Status?.Code !== 100) {
      return { ok: false, error: json?.Status?.Message ?? 'DentSoft API error' }
    }
    return { ok: true, data: json.Response }
  } catch (e: any) {
    return { ok: false, error: String(e?.message ?? e) }
  }
}

// ── DentSoft Calendar Adapter ───────────────────────────────────────────────

const DAYS_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']

export class DentsoftCalendarAdapter implements CalendarAdapter {
  constructor(private config: DentsoftConfig) {}

  async getFreeSlots(days = 3): Promise<SlotGroup[]> {
    const doctorId = this.config.default_doctor_id
    if (!doctorId) {
      console.warn('[dentsoft] getFreeSlots — default_doctor_id not set')
      return []
    }

    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    const result = await dentsoftFetch(this.config, '/Api/v1/Doctor/OnlineWork', {
      params: {
        ClinicID:  this.config.clinic_id,
        UserID:    doctorId,
        Date:      dateStr,
        Range:     `1-${days * 5}`,    // fetch enough days
        Available: 'Available',
      },
    })

    if (!result.ok || !result.data) return []

    // Response can be array of slots or object with date keys
    const rawSlots = Array.isArray(result.data) ? result.data : result.data?.Slots ?? []

    // Group slots by date
    const grouped: Record<string, string[]> = {}
    for (const slot of rawSlots) {
      const slotDate = slot.Date ?? slot.WorkDate ?? ''
      const slotTime = slot.Time ?? slot.StartTime ?? slot.Hour ?? ''
      if (!slotDate || !slotTime) continue

      const dateKey = slotDate.slice(0, 10) // YYYY-MM-DD
      if (!grouped[dateKey]) grouped[dateKey] = []
      grouped[dateKey].push(slotTime.slice(0, 5)) // HH:MM
    }

    // Convert to SlotGroup[] and limit to requested days
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, days)
      .map(([date, times]) => {
        const d       = new Date(date + 'T00:00:00')
        const dayName = DAYS_TR[d.getDay()]
        return { date: `${dayName} (${date})`, times: times.slice(0, 8) }
      })
  }

  async createAppointment(params: AppointmentParams): Promise<AppointmentResult> {
    const doctorId = this.config.default_doctor_id
    if (!doctorId) {
      return { success: false, error: 'default_doctor_id not configured' }
    }

    // DentSoft expects multipart/form-data
    const fd = new FormData()
    fd.append('FullName',      params.name)
    fd.append('ContactMobile', params.phone)
    fd.append('Date',          params.datetime.slice(0, 10))     // YYYY-MM-DD
    fd.append('Time',          params.datetime.slice(11, 16))    // HH:MM
    fd.append('Note',          params.notes ?? '')
    fd.append('PatientNumber', (params as any).tckn ?? '')       // TCKN — optional, empty if unavailable
    if (params.email) fd.append('Email', params.email)

    const result = await dentsoftFetch(
      this.config,
      `/Api/v1/Appointment/New/${encodeURIComponent(this.config.clinic_id)}/${encodeURIComponent(doctorId)}`,
      { method: 'POST', formData: fd }
    )

    if (!result.ok) {
      return { success: false, error: result.error }
    }

    const appointmentId = result.data?.PNR ?? result.data?.AppointmentID ?? result.data?.ID ?? undefined
    return { success: true, appointment_id: appointmentId ? String(appointmentId) : undefined }
  }
}

/**
 * Called from crm-webhooks.ts when crm.provider === 'dentsoft'.
 * Forwards CRM events to DentSoft when needed.
 */
export async function sendDentsoftEvent(
  crm:       DentsoftConfig,
  eventType: string,
  payload:   Record<string, unknown>
): Promise<void> {
  // Currently only log — DentSoft CRM event forwarding can be added later
  console.log(`[dentsoft] CRM event '${eventType}' — payload:`, JSON.stringify(payload).slice(0, 200))
}
