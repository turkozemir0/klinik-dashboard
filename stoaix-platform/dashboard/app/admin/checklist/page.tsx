import { createClient } from '@/lib/supabase/server'
import ChecklistClient from './ChecklistClient'

export default async function ChecklistPage() {
  const supabase = createClient()

  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, slug, sector, status')
    .order('created_at', { ascending: false })

  return <ChecklistClient orgs={orgs ?? []} />
}
