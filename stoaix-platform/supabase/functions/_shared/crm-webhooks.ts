import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendDentsoftEvent } from './dentsoft-adapter.ts'

// ─── Types ────────────────────────────────────────────────────────────────────

export type CrmEventType = 'new_lead' | 'lead_status_change' | 'appointment_booked'

export interface NewLeadPayload {
  event:      'new_lead'
  org_id:     string
  contact_id: string
  phone:      string | null
  channel:    string
  timestamp:  string
}

export interface LeadStatusChangePayload {
  event:          'lead_status_change'
  org_id:         string
  lead_id:        string
  contact_id:     string
  old_status:     string
  new_status:     string
  score:          number
  collected_data: Record<string, unknown>
  timestamp:      string
}

export interface AppointmentBookedPayload {
  event:        'appointment_booked'
  org_id:       string
  contact_name: string
  phone:        string | null
  datetime:     string
  notes?:       string
  timestamp:    string
}

export type CrmEventPayload = NewLeadPayload | LeadStatusChangePayload | AppointmentBookedPayload

interface CrmConfig {
  provider:        string
  webhook_url?:    string
  webhook_secret?: string
  events?:         string[]
  api_url?:        string
  api_key?:        string
  clinic_id?:      string
}

// ─── HMAC-SHA256 signature ────────────────────────────────────────────────────

async function hmacSignature(secret: string, body: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Reads org's crm_config, checks if the event is subscribed, and POSTs to webhook_url.
 * Silent on errors — never throws, never blocks the main flow.
 */
export async function sendCrmEvent(
  supabase: ReturnType<typeof createClient>,
  orgId:    string,
  payload:  CrmEventPayload
): Promise<void> {
  try {
    const { data: org } = await supabase
      .from('organizations')
      .select('crm_config')
      .eq('id', orgId)
      .single()

    if (!org) return

    const crm = org.crm_config as CrmConfig | null
    if (!crm || crm.provider === 'none') return

    // ── Dentsoft provider ──
    if (crm.provider === 'dentsoft') {
      await sendDentsoftEvent(
        { api_url: crm.api_url ?? '', api_key: crm.api_key ?? '', clinic_id: crm.clinic_id },
        payload.event,
        payload as unknown as Record<string, unknown>
      )
      return
    }

    if (crm.provider !== 'webhook') return
    if (!crm.webhook_url) return

    // SSRF guard — only allow HTTPS to public hosts
    try {
      const parsed = new URL(crm.webhook_url)
      if (parsed.protocol !== 'https:') return
      // Block RFC-1918 / loopback ranges
      const host = parsed.hostname
      if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) return
    } catch { return }

    // Check event subscription
    const subscribedEvents = crm.events ?? ['new_lead', 'lead_status_change', 'appointment_booked']
    if (!subscribedEvents.includes(payload.event)) return

    const body = JSON.stringify(payload)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Stoaix-Event': payload.event,
    }

    if (crm.webhook_secret) {
      const sig = await hmacSignature(crm.webhook_secret, body)
      headers['X-Stoaix-Signature'] = `sha256=${sig}`
    }

    const res = await fetch(crm.webhook_url, { method: 'POST', headers, body })
    if (!res.ok) {
      console.warn(`[crm-webhook] POST to ${crm.webhook_url} returned ${res.status}`)
    }
  } catch (err) {
    console.warn('[crm-webhook] sendCrmEvent failed silently:', err)
  }
}
