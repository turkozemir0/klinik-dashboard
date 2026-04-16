import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import InboxClient from './InboxClient'

export default async function InboxPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orgUser } = await supabase
    .from('org_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  let orgId: string | null = orgUser?.organization_id ?? null

  if (!orgId) {
    const { data: sa } = await supabase
      .from('super_admin_users')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (sa) {
      const { data: firstOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('status', 'active')
        .limit(1)
        .maybeSingle()
      orgId = firstOrg?.id ?? null
    }
  }

  if (!orgId) return <div className="p-8 text-slate-500">Organizasyon bulunamadı.</div>

  const lang = cookies().get('lang')?.value === 'en' ? 'en' : 'tr'

  return <InboxClient orgId={orgId} lang={lang} />
}
