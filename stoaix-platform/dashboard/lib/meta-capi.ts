import { createHash } from 'crypto'
import { META_GRAPH_URL } from './meta-api'

/** Normalize + SHA-256 hash a PII value per Meta CAPI spec */
export function normalizeAndHash(value: string | null | undefined): string | null {
  if (!value) return null
  const normalized = value.trim().toLowerCase()
  if (!normalized) return null
  return createHash('sha256').update(normalized).digest('hex')
}

/** Normalize phone to E.164 (default +90 prefix) then hash */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  let cleaned = phone.replace(/[\s\-\(\)]/g, '')
  // Add country code if missing
  if (cleaned.startsWith('0')) cleaned = '+90' + cleaned.slice(1)
  if (!cleaned.startsWith('+')) cleaned = '+90' + cleaned
  return createHash('sha256').update(cleaned).digest('hex')
}

/** Hash all available PII from a contact object */
export function hashContactPii(contact: {
  email?: string | null
  phone?: string | null
  full_name?: string | null
  city?: string | null
}): Record<string, string> {
  const userData: Record<string, string> = {}

  const em = normalizeAndHash(contact.email)
  if (em) userData.em = em

  const ph = normalizePhone(contact.phone)
  if (ph) userData.ph = ph

  if (contact.full_name) {
    const parts = contact.full_name.trim().split(/\s+/)
    const fn = normalizeAndHash(parts[0])
    if (fn) userData.fn = fn
    if (parts.length > 1) {
      const ln = normalizeAndHash(parts[parts.length - 1])
      if (ln) userData.ln = ln
    }
  }

  const ct = normalizeAndHash(contact.city)
  if (ct) userData.ct = ct

  return userData
}

/** Build Meta CAPI event payload */
export function buildCapiPayload(opts: {
  eventName: string
  eventTime: number
  eventId: string
  userData: Record<string, string>
  customData?: Record<string, any>
}) {
  return {
    data: [{
      event_name: opts.eventName,
      event_time: opts.eventTime,
      event_id: opts.eventId,
      action_source: 'system_generated',
      user_data: opts.userData,
      custom_data: {
        source: 'stoaix_platform',
        ...opts.customData,
      },
    }],
  }
}

/** Send event to Meta CAPI */
export async function sendCapiEvent(
  pixelId: string,
  accessToken: string,
  payload: ReturnType<typeof buildCapiPayload>
): Promise<{ success: boolean; error?: string; events_received?: number }> {
  const url = `${META_GRAPH_URL}/${pixelId}/events?access_token=${accessToken}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const body = await res.json()

  if (!res.ok) {
    return { success: false, error: body?.error?.message || `HTTP ${res.status}` }
  }

  return { success: true, events_received: body.events_received }
}
