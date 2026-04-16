import { createClient } from '@/lib/supabase/server'
import TicketsClient from './TicketsClient'

export default async function TicketsPage() {
  const supabase = createClient()

  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('id, subject, message, status, priority, admin_notes, created_at, organization:organizations(id, name)')
    .order('created_at', { ascending: false })
    .limit(100)

  return <TicketsClient tickets={tickets ?? []} />
}
