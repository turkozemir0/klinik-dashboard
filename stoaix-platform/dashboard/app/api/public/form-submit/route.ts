import { NextRequest, NextResponse } from 'next/server'
import { createClient as sbAdmin } from '@supabase/supabase-js'
import { normalizePhone } from '@/lib/phone-utils'
import { checkEntitlement } from '@/lib/entitlements'

function getServiceClient() {
  return sbAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ─── CORS headers ────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
}

function corsJson(body: Record<string, any>, status = 200) {
  return NextResponse.json(body, { status, headers: CORS_HEADERS })
}

// ─── Rate limiting (in-memory, per-key, 60 req/min) ─────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 60
const RATE_WINDOW_MS = 60_000

function isRateLimited(apiKey: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(apiKey)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(apiKey, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return false
  }
  entry.count++
  return entry.count > RATE_LIMIT
}

// Periodic cleanup to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  rateLimitMap.forEach((entry, key) => {
    if (now > entry.resetAt) rateLimitMap.delete(key)
  })
}, 5 * 60_000)

// ─── Field length limits ─────────────────────────────────────────────────────

const FIELD_LIMITS: Record<string, number> = {
  full_name: 200,
  email: 320,
  phone: 20,
}
const DEFAULT_FIELD_LIMIT = 1000
const MAX_COLLECTED_DATA_KEYS = 50

function sanitizeString(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return String(value ?? '').slice(0, maxLen)
  return value.slice(0, maxLen)
}

// ─── Honeypot field (invisible to humans, bots auto-fill it) ─────────────────

const HONEYPOT_FIELD = '_hp_website'

// ─── Body size limit ─────────────────────────────────────────────────────────

const MAX_BODY_SIZE = 64 * 1024 // 64 KB

// ─── OPTIONS (CORS preflight) ────────────────────────────────────────────────

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

// ─── POST /api/public/form-submit ────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // 0. Body size guard
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
      return corsJson({ error: 'payload_too_large', message: 'Request body exceeds 64 KB limit' }, 413)
    }

    // 1. Extract API key (header or body fallback)
    const headerKey = request.headers.get('x-api-key')

    // 2. Parse body (JSON or form-urlencoded)
    let body: Record<string, any> = {}
    const contentType = request.headers.get('content-type') ?? ''

    if (contentType.includes('application/json')) {
      body = await request.json()
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      formData.forEach((value, key) => {
        if (typeof value === 'string') body[key] = value
      })
    } else {
      // Try JSON as default
      try { body = await request.json() } catch { /* empty */ }
    }

    const apiKey = headerKey || (body._api_key as string) || ''
    delete body._api_key

    if (!apiKey) {
      return corsJson({ error: 'missing_api_key', message: 'x-api-key header or _api_key body field required' }, 401)
    }

    // 3. Honeypot check — if filled, silently succeed (don't reveal to bot)
    if (body[HONEYPOT_FIELD]) {
      return corsJson({ success: true, contact_id: '00000000-0000-0000-0000-000000000000', lead_id: '00000000-0000-0000-0000-000000000000' })
    }

    // 4. Clean up any CAPTCHA tokens from body (don't store in collected_data)
    delete body['cf-turnstile-response']
    delete body._turnstile
    delete body['g-recaptcha-response']

    // 5. Rate limit
    if (isRateLimited(apiKey)) {
      return corsJson({ error: 'rate_limited', message: 'Too many requests. Max 60/min per key.' }, 429)
    }

    const service = getServiceClient()

    // 6. Look up org by API key
    const { data: orgs, error: orgErr } = await service
      .from('organizations')
      .select('id, status, channel_config')
      .filter('channel_config->website_forms->>api_key', 'eq', apiKey)

    if (orgErr || !orgs || orgs.length === 0) {
      return corsJson({ error: 'invalid_api_key', message: 'API key not found' }, 401)
    }

    const org = orgs[0]

    // 7. Check org status
    if (org.status !== 'active') {
      return corsJson({ error: 'org_inactive', message: 'Organization is not active' }, 403)
    }

    // 8. Check webhook active flag
    const formConfig = (org.channel_config as any)?.website_forms
    if (!formConfig?.active) {
      return corsJson({ error: 'webhook_disabled', message: 'Website form webhook is disabled for this organization' }, 403)
    }

    // 9. Entitlement check
    const ent = await checkEntitlement(org.id, 'website_form_webhook')
    if (!ent.enabled) {
      return corsJson({ error: 'feature_not_available', message: 'Website form webhook is not available on your plan' }, 403)
    }

    // 10. Apply field mapping
    const fieldMapping: Record<string, string> = formConfig.field_mapping ?? {}
    const reverseMapping: Record<string, string> = {}
    for (const [formField, targetField] of Object.entries(fieldMapping)) {
      reverseMapping[formField] = targetField
    }

    const mapped: Record<string, string> = {}
    const collectedData: Record<string, string> = {}
    let keyCount = 0

    for (const [key, value] of Object.entries(body)) {
      if (key.startsWith('_')) continue // skip internal fields
      if (keyCount >= MAX_COLLECTED_DATA_KEYS) break
      keyCount++

      const targetField = reverseMapping[key]
      const strValue = sanitizeString(value, FIELD_LIMITS[targetField ?? ''] ?? DEFAULT_FIELD_LIMIT)

      if (targetField) {
        mapped[targetField] = strValue
      }
      // All fields go into collected_data
      collectedData[key] = strValue
    }

    // Also check if body directly has standard field names (no mapping needed)
    const fullName = mapped.full_name || body.full_name || body.name || body.ad_soyad || ''
    const rawPhone = mapped.phone || body.phone || body.telefon || body.tel || ''
    const email = mapped.email || body.email || body.eposta || body.e_posta || ''
    const city = mapped.city || body.city || body.sehir || body.il || ''
    const country = mapped.country || body.country || body.ulke || ''

    // 11. Normalize phone
    const defaultCC = formConfig.default_country_code || '90'
    const phone = rawPhone ? normalizePhone(String(rawPhone), defaultCC) : null

    // Need at least phone or email
    if (!phone && !email) {
      return corsJson({ error: 'missing_contact_info', message: 'At least phone or email is required' }, 400)
    }

    // 12. Contact dedup (phone first, then email)
    let contactId: string | null = null

    if (phone) {
      const { data: byPhone } = await service
        .from('contacts')
        .select('id')
        .eq('organization_id', org.id)
        .eq('phone', phone)
        .limit(1)
        .maybeSingle()
      if (byPhone) contactId = byPhone.id
    }

    if (!contactId && email) {
      const { data: byEmail } = await service
        .from('contacts')
        .select('id')
        .eq('organization_id', org.id)
        .eq('email', sanitizeString(email, 320))
        .limit(1)
        .maybeSingle()
      if (byEmail) contactId = byEmail.id
    }

    // 13. Insert or use existing contact
    if (!contactId) {
      const { data: newContact, error: contactErr } = await service
        .from('contacts')
        .insert({
          organization_id: org.id,
          full_name: sanitizeString(fullName, 200) || null,
          phone: phone || null,
          email: sanitizeString(email, 320) || null,
          source_channel: 'web_form',
          status: 'new',
          metadata: {
            city: sanitizeString(city, 200) || undefined,
            country: sanitizeString(country, 200) || undefined,
          },
        })
        .select('id')
        .single()

      if (contactErr || !newContact) {
        console.error('[form-submit] Contact insert error:', contactErr)
        return corsJson({ error: 'contact_create_failed', message: 'Could not create contact' }, 500)
      }
      contactId = newContact.id
    }

    // 14. Insert lead (DB trigger will fire workflow)
    const { data: newLead, error: leadErr } = await service
      .from('leads')
      .insert({
        organization_id: org.id,
        contact_id: contactId,
        status: 'new',
        qualification_score: 5,
        source_channel: 'web_form',
        collected_data: collectedData,
      })
      .select('id')
      .single()

    if (leadErr || !newLead) {
      console.error('[form-submit] Lead insert error:', leadErr)
      return corsJson({ error: 'lead_create_failed', message: 'Could not create lead' }, 500)
    }

    // 15. Success
    return corsJson({
      success: true,
      contact_id: contactId,
      lead_id: newLead.id,
    })

  } catch (err) {
    console.error('[form-submit] Unexpected error:', err)
    return corsJson({ error: 'internal_error', message: 'An unexpected error occurred' }, 500)
  }
}
