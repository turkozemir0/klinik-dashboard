import { NextRequest, NextResponse } from 'next/server'
import { createClient as sbAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { checkChannelReady } from '@/lib/integration-health'
import { getTemplate } from '@/lib/workflow-templates'
import { validateWorkflowConfig } from '@/lib/workflow-validation'

function getServiceClient() {
  return sbAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}
// PATCH — config güncelle veya is_active toggle
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: orgUser } = await supabase
    .from('org_users')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!orgUser) return NextResponse.json({ error: 'No org' }, { status: 403 })
  if (!['admin', 'yönetici'].includes(orgUser.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Check super admin status
  const { data: superAdmin } = await supabase
    .from('super_admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()
  const isSuperAdmin = !!superAdmin

  const body = await request.json()
  let { is_active, config } = body

  // Channel readiness check when activating
  if (is_active === true) {
    const service = getServiceClient()
    const { data: workflow } = await service
      .from('org_workflows')
      .select('template_id')
      .eq('id', params.id)
      .eq('organization_id', orgUser.organization_id)
      .maybeSingle()

    if (workflow) {
      const template = getTemplate(workflow.template_id)
      if (template) {
        const channelCheck = await checkChannelReady(orgUser.organization_id, template.channel)
        if (!channelCheck.ready) {
          return NextResponse.json({
            error:   'channel_not_ready',
            missing: channelCheck.missing,
            message: `Bu iş akışını aktifleştirmek için şu entegrasyonları tamamlayın: ${channelCheck.missing.join(', ')}`,
          }, { status: 400 })
        }
      }
    }
  }

  // Server-side config validation
  if (config !== undefined) {
    const service2 = getServiceClient()
    const { data: wf } = await service2
      .from('org_workflows')
      .select('template_id')
      .eq('id', params.id)
      .eq('organization_id', orgUser.organization_id)
      .maybeSingle()

    if (wf) {
      const validation = validateWorkflowConfig(wf.template_id, config)
      if (!validation.valid) {
        const errors = validation.issues.filter(i => i.severity === 'error')
        return NextResponse.json({
          error: 'validation_failed',
          issues: errors,
          message: errors.map(e => e.message_tr).join(', '),
        }, { status: 400 })
      }
    }
  }

  // Strip clinic_editable: false fields for non-super-admin users
  if (config !== undefined && !isSuperAdmin) {
    const service3 = getServiceClient()
    const { data: wf3 } = await service3
      .from('org_workflows')
      .select('template_id, config')
      .eq('id', params.id)
      .eq('organization_id', orgUser.organization_id)
      .maybeSingle()

    if (wf3) {
      const tmpl = getTemplate(wf3.template_id)
      if (tmpl) {
        const restricted = tmpl.config_fields
          .filter(f => f.clinic_editable === false)
          .map(f => f.key)
        // Merge: start from existing saved config, then apply only non-restricted keys
        const existing = wf3.config ?? {}
        const filtered: Record<string, any> = { ...existing }
        for (const key of Object.keys(config)) {
          if (!restricted.includes(key)) {
            filtered[key] = config[key]
          }
        }
        config = filtered
      }
    }
  }

  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  if (typeof is_active === 'boolean') updates.is_active = is_active
  if (config !== undefined) updates.config = config

  const service = getServiceClient()
  const { data, error } = await service
    .from('org_workflows')
    .update(updates)
    .eq('id', params.id)
    .eq('organization_id', orgUser.organization_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

// DELETE — workflow sil
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: orgUser } = await supabase
    .from('org_users')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!orgUser) return NextResponse.json({ error: 'No org' }, { status: 403 })
  if (!['admin', 'yönetici'].includes(orgUser.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const service = getServiceClient()
  const { error } = await service
    .from('org_workflows')
    .delete()
    .eq('id', params.id)
    .eq('organization_id', orgUser.organization_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
