import { createClient } from '@/lib/supabase/server'
import AdminClient from '@/components/admin/AdminClient'

export default async function AdminPage() {
  const supabase = createClient()

  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, slug, sector, status, created_at, updated_at')
    .order('created_at', { ascending: false })

  const { data: leadCounts } = await supabase
    .from('leads')
    .select('organization_id')

  const countsByOrg: Record<string, number> = {}
  for (const lead of leadCounts ?? []) {
    countsByOrg[lead.organization_id] = (countsByOrg[lead.organization_id] || 0) + 1
  }

  const { data: kbCounts } = await supabase
    .from('knowledge_items')
    .select('organization_id')
    .eq('is_active', true)

  const kbCountsByOrg: Record<string, number> = {}
  for (const item of kbCounts ?? []) {
    kbCountsByOrg[item.organization_id] = (kbCountsByOrg[item.organization_id] || 0) + 1
  }

  return <AdminClient orgs={orgs ?? []} countsByOrg={countsByOrg} kbCountsByOrg={kbCountsByOrg} />
}
