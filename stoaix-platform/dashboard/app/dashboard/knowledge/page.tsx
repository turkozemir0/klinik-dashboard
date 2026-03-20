import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import KnowledgeClient from './KnowledgeClient'

export default async function KnowledgePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orgUser } = await supabase
    .from('org_users')
    .select('organization_id, organizations(id, sector)')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: superAdmin } = await supabase
    .from('super_admin_users')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  let orgId: string | null = null
  let sector = 'other'

  if (orgUser) {
    const org = orgUser.organizations as unknown as { id: string; sector: string } | null
    orgId = orgUser.organization_id
    sector = org?.sector ?? 'other'
  } else if (superAdmin) {
    const { data: firstOrg } = await supabase
      .from('organizations')
      .select('id, sector')
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()
    orgId = firstOrg?.id ?? null
    sector = firstOrg?.sector ?? 'other'
  }

  if (!orgId) return <div className="p-8 text-slate-500">Organizasyon bulunamadı.</div>

  const { data: items } = await supabase
    .from('knowledge_items')
    .select('id, organization_id, item_type, title, description_for_ai, data, tags, is_active, created_at, updated_at')
    .eq('organization_id', orgId)
    .order('updated_at', { ascending: false })

  return <KnowledgeClient items={items ?? []} orgId={orgId} sector={sector} />
}
