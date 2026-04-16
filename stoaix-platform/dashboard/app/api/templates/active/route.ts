import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabase } from '@supabase/supabase-js'

function getServiceClient() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ─── GET /api/templates/active?org_id=xxx&purpose=reengagement ───────────────
// Used by n8n to fetch the approved template name for a given org + purpose.
// Returns: { name, language, components, waba_id }
// Auth: SUPABASE_SERVICE_ROLE_KEY via x-service-key header (n8n internal call)

export async function GET(req: NextRequest) {
  // Internal endpoint — authenticate via service key header
  const serviceKey = req.headers.get('x-service-key')
  if (serviceKey !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const orgId   = searchParams.get('org_id')
  const purpose = searchParams.get('purpose')

  if (!orgId || !purpose) {
    return NextResponse.json({ error: 'org_id ve purpose zorunlu' }, { status: 400 })
  }

  const service = getServiceClient()

  // Get the org's approved template for this purpose
  const { data: template } = await service
    .from('message_templates')
    .select('name, language, components, organization_id')
    .eq('organization_id', orgId)
    .eq('purpose', purpose)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!template) {
    return NextResponse.json({ error: `'${purpose}' purpose için onaylı template yok` }, { status: 404 })
  }

  // Get WABA credentials for this org
  const { data: org } = await service
    .from('organizations')
    .select('channel_config')
    .eq('id', orgId)
    .single()

  const waCreds = (org?.channel_config as any)?.whatsapp?.credentials

  return NextResponse.json({
    name:       template.name,
    language:   template.language,
    components: template.components,
    waba_id:    waCreds?.waba_id ?? null,
  })
}
