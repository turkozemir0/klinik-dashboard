import { NextRequest, NextResponse } from 'next/server'
import { createClient as sbAdmin } from '@supabase/supabase-js'
import type { N8nResultPayload } from '@/lib/workflow-types'

function getServiceClient() {
  return sbAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}
// POST — n8n callback → DB güncelle
export async function POST(request: NextRequest) {
  // Secret validation — N8N_RESULT_SECRET veya WORKFLOW_INTERNAL_SECRET fallback
  const secret = request.headers.get('x-n8n-secret')
  const expectedSecret = process.env.N8N_RESULT_SECRET || process.env.WORKFLOW_INTERNAL_SECRET
  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!expectedSecret) {
    console.warn('[n8n-result] No N8N_RESULT_SECRET or WORKFLOW_INTERNAL_SECRET set — endpoint is unprotected')
  }

  let body: N8nResultPayload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { run_id, status, n8n_execution_id, result } = body

  if (!run_id || !status) {
    return NextResponse.json({ error: 'run_id ve status zorunlu' }, { status: 400 })
  }

  const service = getServiceClient()

  // workflow_run güncelle — idempotency: sadece running durumundaki run'ları güncelle
  const { data: run, error: runErr } = await service
    .from('workflow_runs')
    .update({
      status,
      result:           result ?? {},
      n8n_execution_id: n8n_execution_id ?? null,
      finished_at:      new Date().toISOString(),
    })
    .eq('id', run_id)
    .eq('status', 'running')
    .select('id, org_workflow_id, organization_id, contact_id, trigger_ref_id')
    .maybeSingle()

  if (runErr || !run) {
    // Zaten işlenmiş veya bulunamadı — 200 dön (n8n retry döngüsü kırılmasın)
    return NextResponse.json({ already_processed: true })
  }

  // V8/C5: satisfaction survey kaydet (score varsa)
  if (result?.score && status === 'success') {
    const { data: workflow } = await service
      .from('org_workflows')
      .select('template_id')
      .eq('id', run.org_workflow_id)
      .single()

    const isSatisfaction =
      workflow?.template_id === 'satisfaction_survey_voice' ||
      workflow?.template_id === 'satisfaction_survey_chat'

    if (isSatisfaction && result.score >= 1 && result.score <= 5) {
      // Duplicate check — aynı run_id ile zaten kayıt varsa skip
      const { data: existingSurvey } = await service
        .from('satisfaction_surveys')
        .select('id')
        .eq('run_id', run_id)
        .maybeSingle()

      if (!existingSurvey) {
        await service
          .from('satisfaction_surveys')
          .insert({
            organization_id: run.organization_id,
            contact_id:      run.contact_id ?? null,
            run_id,
            score:           result.score,
            comment:         result.notes ?? null,
            low_score_notified: result.score <= 2 ? false : undefined,
          })
      }
    }
  }

  // Reactivation: lead status → nurturing
  if (status === 'success' && run.contact_id) {
    const { data: wfCheck } = await service
      .from('org_workflows').select('template_id')
      .eq('id', run.org_workflow_id).single()

    if (wfCheck?.template_id === 'reactivation_chat' || wfCheck?.template_id === 'reactivation_voice') {
      await service.from('leads').update({
        status: 'nurturing',
        updated_at: new Date().toISOString(),
      })
      .eq('contact_id', run.contact_id)
      .eq('organization_id', run.organization_id)
      .in('status', ['new', 'in_progress', 'lost'])
    }
  }

  // Retry: next_action === 'retry' → call_queue INSERT
  if (result?.next_action === 'retry') {
    const { data: workflow } = await service
      .from('org_workflows')
      .select('template_id, config')
      .eq('id', run.org_workflow_id)
      .single()

    if (workflow) {
      const config          = workflow.config as Record<string, any>
      const retryHours      = Number(config.retry_interval_hours ?? 2)
      const maxAttempts     = Number(config.max_retries ?? 3)
      const currentAttempt  = Number((result as any).attempt ?? 1)

      if (currentAttempt < maxAttempts && run.contact_id) {
        const { data: contact } = await service
          .from('contacts')
          .select('phone')
          .eq('id', run.contact_id)
          .maybeSingle()

        if (contact?.phone) {
          // Duplicate check — aynı run_id ile pending/dialing kayıt varsa skip
          const { data: existingQueue } = await service
            .from('call_queue')
            .select('id')
            .eq('run_id', run_id)
            .in('status', ['pending', 'dialing'])
            .maybeSingle()

          if (!existingQueue) {
            const scheduledAt = new Date(Date.now() + retryHours * 3600 * 1000)
            await service
              .from('call_queue')
              .insert({
                run_id,
                organization_id: run.organization_id,
                phone:           contact.phone,
                script_type:     workflow.template_id,
                scheduled_at:    scheduledAt.toISOString(),
                attempt:         currentAttempt + 1,
                max_attempts:    maxAttempts,
                status:          'pending',
              })
          }
        }
      }
    }
  }

  return NextResponse.json({ success: true })
}
