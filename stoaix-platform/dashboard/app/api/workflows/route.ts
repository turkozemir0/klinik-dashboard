import { NextRequest, NextResponse } from 'next/server'
import { createClient as sbAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { checkEntitlement } from '@/lib/entitlements'
import { getTemplate } from '@/lib/workflow-templates'
import { checkChannelReady } from '@/lib/integration-health'
import { demoWriteBlock } from '@/lib/demo-guard'

function getServiceClient() {
  return sbAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}
// GET — Org'un aktif workflow'ları
export async function GET() {
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
    .from('org_workflows')
    .select('*')
    .eq('organization_id', orgUser.organization_id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST — Template aktif et
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: orgUser } = await supabase
    .from('org_users')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!orgUser) return NextResponse.json({ error: 'No org' }, { status: 403 })

  const blocked = demoWriteBlock(orgUser.organization_id)
  if (blocked) return blocked

  if (!['admin', 'yönetici'].includes(orgUser.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { template_id, config = {}, is_active = true } = body

  if (!template_id) {
    return NextResponse.json({ error: 'template_id zorunlu' }, { status: 400 })
  }

  const template = getTemplate(template_id)
  if (!template) {
    return NextResponse.json({ error: 'Geçersiz template_id' }, { status: 400 })
  }

  const ent = await checkEntitlement(orgUser.organization_id, template.required_feature)
  if (!ent.enabled) {
    return NextResponse.json({
      error:   'upgrade_required',
      feature: template.required_feature,
    }, { status: 403 })
  }

  // Channel readiness check — only when activating
  if (is_active) {
    const channelCheck = await checkChannelReady(orgUser.organization_id, template.channel)
    if (!channelCheck.ready) {
      return NextResponse.json({
        error:   'channel_not_ready',
        missing: channelCheck.missing,
        message: `Bu iş akışını aktifleştirmek için şu entegrasyonları tamamlayın: ${channelCheck.missing.join(', ')}`,
      }, { status: 400 })
    }
  }

  // Inject default sequence if template defines one and config doesn't have it
  if (template.default_sequence && !config.sequence) {
    config.sequence = template.default_sequence
  }

  const service = getServiceClient()
  const { data, error } = await service
    .from('org_workflows')
    .upsert({
      organization_id: orgUser.organization_id,
      template_id,
      is_active,
      config,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'organization_id,template_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fire-and-forget: workflow activation event
  if (is_active) {
    service.from('org_events').insert({
      org_id: orgUser.organization_id,
      event_type: 'workflow_activated',
      metadata: { template_id },
    }).then(() => {})
  }

  return NextResponse.json(data)
}
