/**
 * Dentsoft Calendar Adapter — Skeleton
 *
 * API docs are behind Cloudflare, customer will provide access.
 * All methods log a warning and are no-ops until docs arrive.
 *
 * Expected endpoints (to be confirmed):
 *   GET  /api/appointments/available-slots?clinic_id=...&from=...&to=...
 *   POST /api/appointments
 *   GET  /api/patients/search?phone=...
 *
 * Authentication: API Key header (X-API-Key or Bearer — TBD)
 *
 * Once docs are received, implement and remove this comment block.
 */

import type { CalendarAdapter, AppointmentParams, AppointmentResult, SlotGroup } from './calendar-adapter.ts'

interface DentsoftConfig {
  api_url:    string
  api_key:    string
  clinic_id?: string
}

export class DentsoftCalendarAdapter implements CalendarAdapter {
  constructor(private config: DentsoftConfig) {}

  async getFreeSlots(_days = 3): Promise<SlotGroup[]> {
    // TODO: GET ${this.config.api_url}/appointments/available-slots
    console.warn('[dentsoft] getFreeSlots — adapter not yet implemented, awaiting API docs')
    return []
  }

  async createAppointment(_params: AppointmentParams): Promise<AppointmentResult> {
    // TODO: POST ${this.config.api_url}/appointments
    console.warn('[dentsoft] createAppointment — adapter not yet implemented, awaiting API docs')
    return { success: false, error: 'Dentsoft adapter not yet implemented — awaiting API docs' }
  }
}

/**
 * Called from crm-webhooks.ts when crm.provider === 'dentsoft'.
 * Forwards CRM events to Dentsoft when the adapter is implemented.
 */
export async function sendDentsoftEvent(
  crm:       DentsoftConfig,
  eventType: string,
  payload:   Record<string, unknown>
): Promise<void> {
  // TODO: POST to Dentsoft CRM event endpoint when API docs received
  console.warn(`[dentsoft] CRM event '${eventType}' dropped — adapter not yet implemented`)
}
