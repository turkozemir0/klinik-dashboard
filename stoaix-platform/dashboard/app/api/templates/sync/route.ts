import { NextResponse } from 'next/server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

function getServiceClient() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const GRAPH = 'https://graph.facebook.com/v19.0'

// Meta status → our status mapping
const META_STATUS_MAP: Record<string, string> = {
  APPROVED: 'approved',
  PENDING:  'pending',
  REJECTED: 'rejected',
  // PAUSED, DISABLED etc. → keep as-is
}

// ─── POST /api/templates/sync ────────────────────────────────────────────────
// Fetches all templates from Meta WABA and syncs statuses to our DB.
// Called on page load and on manual refresh.

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

  // Get WhatsApp credentials
  const { data: org } = await service
    .from('organizations')
    .select('channel_config')
    .eq('id', orgUser.organization_id)
    .single()

  const waCreds = (org?.channel_config as any)?.whatsapp?.credentials
  if (!waCreds?.waba_id || !waCreds?.access_token) {
    return NextResponse.json({ synced: 0, message: 'WhatsApp bağlı değil' })
  }

  // Fetch all templates from Meta
  let metaTemplates: any[] = []
  let url: string | null = `${GRAPH}/${waCreds.waba_id}/message_templates?fields=name,language,status,rejected_reason,category&limit=100`

  while (url) {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${waCreds.access_token}` },
    })
    if (!res.ok) {
      console.error('[templates/sync] Meta fetch error:', await res.text())
      return NextResponse.json({ error: 'Meta API hatası' }, { status: 400 })
    }
    const data = await res.json()
    metaTemplates = metaTemplates.concat(data.data ?? [])
    url = data.paging?.next ?? null
  }

  // Build lookup: name+language → meta status
  const metaLookup = new Map<string, { status: string; rejected_reason?: string; id: string }>()
  for (const mt of metaTemplates) {
    metaLookup.set(`${mt.name}__${mt.language}`, {
      status: mt.status,
      rejected_reason: mt.rejected_reason,
      id: mt.id,
    })
  }

  // Fetch our templates (draft/pending only — no need to re-check approved)
  const { data: ourTemplates } = await service
    .from('message_templates')
    .select('id, name, language, status')
    .eq('organization_id', orgUser.organization_id)
    .in('status', ['draft', 'pending'])

  let synced = 0
  for (const t of ourTemplates ?? []) {
    const metaInfo = metaLookup.get(`${t.name}__${t.language}`)
    if (!metaInfo) continue

    const newStatus = META_STATUS_MAP[metaInfo.status]
    if (!newStatus || newStatus === t.status) continue

    await service
      .from('message_templates')
      .update({
        status:           newStatus,
        meta_template_id: metaInfo.id,
        rejection_reason: metaInfo.rejected_reason || null,
        updated_at:       new Date().toISOString(),
      })
      .eq('id', t.id)

    synced++
  }

  return NextResponse.json({ synced, total_meta: metaTemplates.length })
}
