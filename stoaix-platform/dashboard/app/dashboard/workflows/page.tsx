import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import WorkflowsClient from './WorkflowsClient'

export const dynamic = 'force-dynamic'

export default async function WorkflowsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <WorkflowsClient />
}
