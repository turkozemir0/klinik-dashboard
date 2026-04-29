import { NextResponse } from 'next/server'
import { createClient as sbAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { checkEntitlement } from '@/lib/entitlements'
import { WORKFLOW_TEMPLATES } from '@/lib/workflow-templates'
import { checkChannelReadyFromConfig } from '@/lib/integration-health'
import type { TemplateWithStatus } from '@/lib/workflow-types'

function getServiceClient() {
  return sbAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}
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

  const orgId = orgUser.organization_id

  // Fetch org's active workflows + channel config
  const service = getServiceClient()
  const [workflowsRes, orgRes] = await Promise.all([
    service
      .from('org_workflows')
      .select('id, template_id, is_active, config')
      .eq('organization_id', orgId),
    service
      .from('organizations')
      .select('channel_config, sector, ai_persona')
      .eq('id', orgId)
      .maybeSingle(),
  ])

  const orgWorkflows = workflowsRes.data ?? []
  const channelConfig = orgRes.data?.channel_config as any

  const workflowByTemplateId = Object.fromEntries(
    orgWorkflows.map(w => [w.template_id, w])
  )

  // Fetch run stats for active workflows
  const activeWorkflowIds = orgWorkflows.filter(w => w.is_active).map(w => w.id)
  let runStatsMap: Record<string, { today_runs: number; success_rate: number; last_run_at: string | null }> = {}

  if (activeWorkflowIds.length > 0) {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [todayRes, weekRes] = await Promise.all([
      service
        .from('workflow_runs')
        .select('org_workflow_id, id')
        .in('org_workflow_id', activeWorkflowIds)
        .gte('created_at', todayStart),
      service
        .from('workflow_runs')
        .select('org_workflow_id, status, created_at')
        .in('org_workflow_id', activeWorkflowIds)
        .gte('created_at', sevenDaysAgo),
    ])

    const todayRuns = todayRes.data ?? []
    const weekRuns = weekRes.data ?? []

    // Aggregate today counts
    const todayCounts: Record<string, number> = {}
    for (const r of todayRuns) {
      todayCounts[r.org_workflow_id] = (todayCounts[r.org_workflow_id] ?? 0) + 1
    }

    // Aggregate week success rate + last run
    const weekAgg: Record<string, { total: number; success: number; lastAt: string | null }> = {}
    for (const r of weekRuns) {
      if (!weekAgg[r.org_workflow_id]) weekAgg[r.org_workflow_id] = { total: 0, success: 0, lastAt: null }
      const agg = weekAgg[r.org_workflow_id]
      agg.total++
      if (r.status === 'success') agg.success++
      if (!agg.lastAt || r.created_at > agg.lastAt) agg.lastAt = r.created_at
    }

    for (const wfId of activeWorkflowIds) {
      const agg = weekAgg[wfId]
      runStatsMap[wfId] = {
        today_runs: todayCounts[wfId] ?? 0,
        success_rate: agg && agg.total > 0 ? Math.round((agg.success / agg.total) * 100) : 0,
        last_run_at: agg?.lastAt ?? null,
      }
    }
  }

  // Build response with plan_allowed + channel_ready for each template
  const results: TemplateWithStatus[] = await Promise.all(
    WORKFLOW_TEMPLATES.map(async (template) => {
      const ent = await checkEntitlement(orgId, template.required_feature)
      const existing = workflowByTemplateId[template.id]
      const channelCheck = checkChannelReadyFromConfig(channelConfig, template.channel)
      const stats = existing?.id ? runStatsMap[existing.id] : undefined
      return {
        ...template,
        plan_allowed:       ent.enabled,
        active_workflow_id: existing?.id ?? null,
        is_active:          existing?.is_active ?? false,
        config:             existing?.config ?? {},
        channel_ready:      channelCheck.ready,
        missing_channels:   channelCheck.missing,
        today_runs:         stats?.today_runs,
        success_rate:       stats?.success_rate,
        last_run_at:        stats?.last_run_at ?? null,
      }
    })
  )

  const orgLang = (orgRes.data?.ai_persona as any)?.language ?? 'tr'
  return NextResponse.json({ templates: results, org_sector: orgRes.data?.sector ?? 'general', org_lang: orgLang })
}
