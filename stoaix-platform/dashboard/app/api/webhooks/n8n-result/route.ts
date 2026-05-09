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

  // Chatbot follow-up zinciri — CW1 başarı → CW2 ilk attempt, CW2 başarı → sonraki attempt
  if (status === 'success' && run.contact_id) {
    const { data: wf } = await service
      .from('org_workflows')
      .select('config, template_id')
      .eq('id', run.org_workflow_id)
      .single()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://platform.stoaix.com'

    // CW1 başarıyla tamamlandı → chatbot_followup aktifse ilk no_reply tetikle
    // n8n CW2 içindeki Wait node no_reply_hours kadar bekleyip mesaj gönderir
    if (wf?.template_id === 'lead_first_contact_chat') {
      const { data: cw2 } = await service
        .from('org_workflows')
        .select('id')
        .eq('organization_id', run.organization_id)
        .eq('template_id', 'chatbot_followup')
        .eq('is_active', true)
        .maybeSingle()

      if (cw2) {
        await fetch(`${appUrl}/api/workflows/process-trigger`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-secret': process.env.WORKFLOW_INTERNAL_SECRET ?? '',
          },
          body: JSON.stringify({
            event: 'no_reply',
            org_id: run.organization_id,
            data: { contact_id: run.contact_id, attempt: 1 },
          }),
        })
      }
    }

    // CW2 başarıyla tamamlandı → stop koşullarını kontrol et → sonraki attempt
    if (wf?.template_id === 'chatbot_followup') {
      const maxFollowups   = Number(wf.config?.max_followups ?? 2)
      const currentAttempt = Number(result?.attempt ?? 1)

      if (currentAttempt < maxFollowups) {
        let shouldStop = false

        // stop_on_reply: son no_reply_hours * 2 içinde gelen inbound mesaj var mı?
        if (wf.config?.stop_on_reply) {
          const windowMs = Number(wf.config?.no_reply_hours ?? 4) * 2 * 3600 * 1000
          const since = new Date(Date.now() - windowMs).toISOString()
          const { data: convs } = await service
            .from('conversations')
            .select('id')
            .eq('organization_id', run.organization_id)
            .eq('contact_id', run.contact_id)
          if (convs?.length) {
            const { data: inboundMsg } = await service
              .from('messages')
              .select('id')
              .in('conversation_id', convs.map(c => c.id))
              .eq('role', 'user')
              .gte('created_at', since)
              .limit(1)
              .maybeSingle()
            if (inboundMsg) shouldStop = true
          }
        }

        // stop_on_appointment: gelecekte randevusu var mı?
        if (!shouldStop && wf.config?.stop_on_appointment) {
          const { data: appt } = await service
            .from('appointments')
            .select('id')
            .eq('contact_id', run.contact_id)
            .gte('scheduled_at', new Date().toISOString())
            .limit(1)
            .maybeSingle()
          if (appt) shouldStop = true
        }

        if (!shouldStop) {
          await fetch(`${appUrl}/api/workflows/process-trigger`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-internal-secret': process.env.WORKFLOW_INTERNAL_SECRET ?? '',
            },
            body: JSON.stringify({
              event: 'no_reply',
              org_id: run.organization_id,
              ref_id: run_id,
              data: { contact_id: run.contact_id, attempt: currentAttempt + 1 },
            }),
          })
        }
      }
    }
  }

  return NextResponse.json({ success: true })
}
