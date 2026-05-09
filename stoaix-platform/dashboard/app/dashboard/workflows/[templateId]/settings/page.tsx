import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTemplate } from '@/lib/workflow-templates'
import WorkflowSettingsClient from './WorkflowSettingsClient'

export default async function WorkflowSettingsPage({
  params,
}: {
  params: { templateId: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orgUser } = await supabase
    .from('org_users')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!orgUser || !['admin', 'yönetici'].includes(orgUser.role ?? '')) {
    redirect('/dashboard/workflows')
  }

  const template = getTemplate(params.templateId)
  if (!template) redirect('/dashboard/workflows')

  // Check super admin status
  const { data: superAdmin } = await supabase
    .from('super_admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const isSuperAdmin = !!superAdmin

  // Fetch active workflow for this template + org wa provider
  const [{ data: workflow }, { data: org }] = await Promise.all([
    supabase
      .from('org_workflows')
      .select('id, config, is_active')
      .eq('organization_id', orgUser.organization_id)
      .eq('template_id', params.templateId)
      .maybeSingle(),
    supabase
      .from('organizations')
      .select('channel_config')
      .eq('id', orgUser.organization_id)
      .maybeSingle(),
  ])

  if (!workflow) redirect('/dashboard/workflows')

  const waProvider = (org?.channel_config as any)?.whatsapp?.provider ?? 'meta'

  return (
    <WorkflowSettingsClient
      template={template}
      workflowId={workflow.id}
      savedConfig={workflow.config ?? {}}
      isActive={workflow.is_active}
      isSuperAdmin={isSuperAdmin}
      waProvider={waProvider}
    />
  )
}
