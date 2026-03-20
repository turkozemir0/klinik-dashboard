import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import AdminKBClient from '@/components/admin/AdminKBClient'

export default async function AdminKBPage({ params }: { params: { orgId: string } }) {
  const supabase = createClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug, sector')
    .eq('id', params.orgId)
    .single()

  if (!org) notFound()

  const { data: items } = await supabase
    .from('knowledge_items')
    .select('id, organization_id, item_type, title, description_for_ai, data, tags, is_active, created_at, updated_at')
    .eq('organization_id', params.orgId)
    .order('item_type', { ascending: true })

  return (
    <AdminKBClient
      org={org}
      items={items ?? []}
    />
  )
}
