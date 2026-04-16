import { NextResponse } from 'next/server'
import { createClient as sbAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { checkEntitlement } from '@/lib/entitlements'
import { WORKFLOW_TEMPLATES } from '@/lib/workflow-templates'
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

  // Fetch org's active workflows
  const service = getServiceClient()
  const { data: orgWorkflows } = await service
    .from('org_workflows')
    .select('id, template_id, is_active, config')
    .eq('organization_id', orgId)

  const workflowByTemplateId = Object.fromEntries(
    (orgWorkflows ?? []).map(w => [w.template_id, w])
  )

  // Build response with plan_allowed for each template
  const results: TemplateWithStatus[] = await Promise.all(
    WORKFLOW_TEMPLATES.map(async (template) => {
      const ent = await checkEntitlement(orgId, template.required_feature)
      const existing = workflowByTemplateId[template.id]
      return {
        ...template,
        plan_allowed:       ent.enabled,
        active_workflow_id: existing?.id ?? null,
        is_active:          existing?.is_active ?? false,
        config:             existing?.config ?? {},
      }
    })
  )

  return NextResponse.json(results)
}
