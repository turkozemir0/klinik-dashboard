import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { normalizePhone } from '@/lib/phone-utils'

function getServiceClient() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const GRAPH = 'https://graph.facebook.com/v19.0'
const SYNC_COOLDOWN_MS = 5 * 60 * 1000 // 5 minutes

interface MetaLead {
  id: string
  created_time: string
  field_data: { name: string; values: string[] }[]
  ad_name?: string
  campaign_name?: string
}

function extractField(lead: MetaLead, ...names: string[]): string {
  for (const name of names) {
    const f = lead.field_data?.find(
      (d) => d.name.toLowerCase() === name.toLowerCase()
    )
    if (f?.values?.[0]) return f.values[0]
  }
  return ''
}

// ─── POST /api/leadgen/sync ─────────────────────────────────────────────────
// Syncs leads from active Meta Lead Forms into contacts + leads tables.
export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = getServiceClient()
  const { data: orgUser } = await service
    .from('org_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!orgUser) return NextResponse.json({ error: 'Org bulunamadı' }, { status: 403 })

  const orgId = orgUser.organization_id

  // 1. Read config
  const { data: org } = await service
    .from('organizations')
    .select('channel_config')
    .eq('id', orgId)
    .single()

  const config = (org?.channel_config ?? {}) as any
  const leadgen = config?.meta_leadgen ?? {}
  const activeFormIds: string[] = leadgen.active_form_ids ?? []
  const connectedAt: string | null = leadgen.connected_at ?? null
  const lastSyncAt: string | null = leadgen.last_sync_at ?? null

  if (activeFormIds.length === 0 || !connectedAt) {
    return NextResponse.json({ skipped: true, reason: 'no_active_forms' })
  }

  // 2. Throttle: skip if synced within cooldown
  if (lastSyncAt) {
    const elapsed = Date.now() - new Date(lastSyncAt).getTime()
    if (elapsed < SYNC_COOLDOWN_MS) {
      return NextResponse.json({ skipped: true, reason: 'cooldown' })
    }
  }

  // Get access token
  const igCreds = config?.instagram?.credentials
  if (!igCreds?.access_token) {
    return NextResponse.json({ error: 'instagram_not_connected' }, { status: 400 })
  }

  const connectedAtDate = new Date(connectedAt)
  let totalSynced = 0
  let totalDuplicates = 0
  let totalErrors = 0

  // 3. Process each active form
  for (const formId of activeFormIds) {
    try {
      // Fetch leads from Meta (up to 100)
      const url = `${GRAPH}/${formId}/leads?fields=id,created_time,field_data,ad_name,campaign_name&limit=100&access_token=${igCreds.access_token}`
      const res = await fetch(url)
      const data = await res.json()

      if (!res.ok || data.error) {
        console.error(`[leadgen/sync] Meta API error for form ${formId}:`, data.error)
        totalErrors++
        continue
      }

      const metaLeads: MetaLead[] = data.data ?? []

      // Filter: only leads created after connected_at
      const newLeads = metaLeads.filter(
        (l) => new Date(l.created_time) >= connectedAtDate
      )

      if (newLeads.length === 0) continue

      // Batch dedup: fetch existing fb_lead_ids for this org
      const fbLeadIds = newLeads.map((l) => l.id)
      const existingFbIds = new Set<string>()

      // Query contacts with metadata containing fb_lead_id
      const { data: existingContacts } = await service
        .from('contacts')
        .select('metadata')
        .eq('organization_id', orgId)
        .eq('source_channel', 'facebook_leadgen')

      if (existingContacts) {
        for (const c of existingContacts) {
          const fbId = (c.metadata as any)?.fb_lead_id
          if (fbId) existingFbIds.add(String(fbId))
        }
      }

      // Process each lead
      for (const lead of newLeads) {
        if (existingFbIds.has(lead.id)) {
          totalDuplicates++
          continue
        }

        const fullName = extractField(lead, 'full_name', 'first_name', 'ad_soyad')
        const rawPhone = extractField(lead, 'phone_number', 'telefon')
        const email = extractField(lead, 'email', 'e-posta')
        const phone = rawPhone ? normalizePhone(rawPhone) : null

        // Insert contact
        const { data: contact, error: contactErr } = await service
          .from('contacts')
          .insert({
            organization_id: orgId,
            full_name: fullName || null,
            phone: phone || null,
            email: email || null,
            source_channel: 'facebook_leadgen',
            status: 'new',
            metadata: {
              fb_lead_id: lead.id,
              fb_form_id: formId,
              fb_ad_name: lead.ad_name || null,
            },
          })
          .select('id')
          .single()

        if (contactErr || !contact) {
          console.error(`[leadgen/sync] Contact insert error:`, contactErr)
          totalErrors++
          continue
        }

        // Build collected_data from all field_data
        const collectedData: Record<string, string> = {}
        for (const f of lead.field_data ?? []) {
          collectedData[f.name] = f.values?.[0] ?? ''
        }
        collectedData._fb_form_id = formId
        collectedData._fb_lead_id = lead.id
        if (lead.ad_name) collectedData._fb_ad_name = lead.ad_name
        if (lead.campaign_name) collectedData._fb_campaign_name = lead.campaign_name

        // Insert lead
        const { error: leadErr } = await service
          .from('leads')
          .insert({
            organization_id: orgId,
            contact_id: contact.id,
            status: 'new',
            qualification_score: 5,
            source_channel: 'facebook_leadgen',
            collected_data: collectedData,
          })

        if (leadErr) {
          console.error(`[leadgen/sync] Lead insert error:`, leadErr)
          totalErrors++
          continue
        }

        totalSynced++
        existingFbIds.add(lead.id) // prevent dups within same batch
      }
    } catch (err) {
      console.error(`[leadgen/sync] Error processing form ${formId}:`, err)
      totalErrors++
    }
  }

  // 4. Update last_sync_at
  const updatedConfig = {
    ...config,
    meta_leadgen: {
      ...leadgen,
      last_sync_at: new Date().toISOString(),
    },
  }

  await service
    .from('organizations')
    .update({ channel_config: updatedConfig })
    .eq('id', orgId)

  return NextResponse.json({
    synced: totalSynced,
    duplicates: totalDuplicates,
    errors: totalErrors,
  })
}
