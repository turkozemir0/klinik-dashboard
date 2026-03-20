import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Get org info
  const { data: orgUser } = await supabase
    .from('org_users')
    .select('organization_id, role, organization:organizations(id, name, slug, sector)')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: superAdmin } = await supabase
    .from('super_admin_users')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  // For super admin without an org, show a default
  const orgName = (orgUser?.organization as any)?.name ?? (superAdmin ? 'stoaix Admin' : '')

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar orgName={orgName} isSuperAdmin={!!superAdmin} />
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  )
}
