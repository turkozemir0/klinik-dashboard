import { NextRequest, NextResponse } from 'next/server'
import { createClient as sbAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { getTemplate } from '@/lib/workflow-templates'
import { checkEntitlement } from '@/lib/entitlements'

function getServiceClient() {
  return sbAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}
// POST — Manuel workflow tetikleme
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
  if (!['admin', 'yönetici', 'satisci'].includes(orgUser.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { workflow_id, contact_id, phone } = body

  if (!workflow_id || !phone) {
    return NextResponse.json({ error: 'workflow_id ve phone zorunlu' }, { status: 400 })
  }

  const service = getServiceClient()

  // Workflow'u getir
  const { data: workflow, error: wfErr } = await service
    .from('org_workflows')
    .select('*')
    .eq('id', workflow_id)
    .eq('organization_id', orgUser.organization_id)
    .single()

  if (wfErr || !workflow) {
    return NextResponse.json({ error: 'Workflow bulunamadı' }, { status: 404 })
  }

  if (!workflow.is_active) {
    return NextResponse.json({ error: 'Workflow aktif değil' }, { status: 400 })
  }

  const template = getTemplate(workflow.template_id)
  if (!template) {
    return NextResponse.json({ error: 'Template bulunamadı' }, { status: 400 })
  }

  // Entitlement kontrol
  const ent = await checkEntitlement(orgUser.organization_id, template.required_feature)
  if (!ent.enabled) {
    return NextResponse.json({ error: 'upgrade_required', feature: template.required_feature }, { status: 403 })
  }

  // Contact bilgisi (opsiyonel)
  let contactData: Record<string, any> = {}
  if (contact_id) {
    const { data: contact } = await service
      .from('contacts')
      .select('phone, full_name, source_channel')
      .eq('id', contact_id)
      .maybeSingle()
    if (contact) {
      contactData = {
        name:         contact.full_name ?? '',
        lead_source:  contact.source_channel ?? '',
      }
    }
  }

  // workflow_runs INSERT
  const { data: run, error: runErr } = await service
    .from('workflow_runs')
    .insert({
      org_workflow_id: workflow.id,
      organization_id: orgUser.organization_id,
      contact_id:      contact_id ?? null,
      contact_phone:   phone,
      trigger_type:    'manual',
      status:          'pending',
    })
    .select('id')
    .single()

  if (runErr || !run) {
    return NextResponse.json({ error: 'Run oluşturulamadı' }, { status: 500 })
  }

  // n8n dispatch
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_BASE_URL
  if (n8nWebhookUrl) {
    const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://platform.stoaix.com'
    const payload = {
      run_id:       run.id,
      org_id:       orgUser.organization_id,
      phone,
      config:       workflow.config,
      script_type:  template.id,
      contact_data: contactData,
      callback_url: `${dashboardUrl}/api/webhooks/n8n-result`,
    }

    try {
      const r = await fetch(`${n8nWebhookUrl.replace(/\/$/, '')}/webhook/${template.n8n_workflow_id}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      if (r.ok) {
        await service.from('workflow_runs')
          .update({ status: 'running', started_at: new Date().toISOString() })
          .eq('id', run.id)
      } else {
        console.error('[workflows/trigger] n8n returned', r.status)
        await service.from('workflow_runs')
          .update({ status: 'failed', finished_at: new Date().toISOString() })
          .eq('id', run.id)
      }
    } catch (e) {
      console.error('[workflows/trigger] n8n dispatch failed:', e)
      await service.from('workflow_runs')
        .update({ status: 'failed', finished_at: new Date().toISOString() })
        .eq('id', run.id)
    }
  }

  return NextResponse.json({ run_id: run.id, status: 'dispatched' })
}
