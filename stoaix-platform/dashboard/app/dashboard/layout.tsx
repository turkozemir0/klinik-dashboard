import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import BillingStatusBanner from '@/components/billing/BillingStatusBanner'
import ConsentGuard from '@/components/ConsentGuard'
import { LangProvider } from '@/lib/lang-context'
import { DemoProvider } from '@/lib/demo-context'
import { OrgProvider } from '@/lib/org-context'
import DemoBanner from '@/components/DemoBanner'
import SupportChatWidget from '@/components/support/SupportChatWidget'
import type { Lang } from '@/lib/i18n'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: orgUser } = await supabase
    .from('org_users')
    .select('organization_id, role, organization:organizations(id, name, slug, sector, is_demo)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .maybeSingle()

  const { data: superAdmin } = await supabase
    .from('super_admin_users')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  const orgName = (orgUser?.organization as any)?.name ?? (superAdmin ? 'stoaix Admin' : '')
  const orgId = (orgUser?.organization as any)?.id ?? null
  const userRole = orgUser?.role ?? null
  const isDemo = (orgUser?.organization as any)?.is_demo === true

  const cookieLang = cookies().get('lang')?.value as Lang | undefined
  const initialLang: Lang = cookieLang === 'en' ? 'en' : 'tr'

  return (
    <LangProvider initialLang={initialLang}>
      <DemoProvider isDemo={isDemo}>
        <OrgProvider value={{ orgId, orgName, userRole, userId: user.id, isSuperAdmin: !!superAdmin }}>
        <div className="relative flex min-h-screen [min-height:100dvh] bg-transparent">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-[-12rem] top-[-10rem] h-[24rem] w-[24rem] rounded-full bg-sky-200/30 blur-3xl" />
            <div className="absolute right-[-10rem] top-[8rem] h-[22rem] w-[22rem] rounded-full bg-teal-200/25 blur-3xl" />
          </div>
          <Sidebar orgName={orgName} isSuperAdmin={!!superAdmin} userRole={userRole} userId={user.id} orgId={orgId} isDemo={isDemo} />
          <main className="relative flex-1 min-w-0 overflow-auto pt-16 md:pt-0">
            <DemoBanner />
            {isDemo ? children : (
              <>
                <BillingStatusBanner />
                <ConsentGuard>
                  {children}
                </ConsentGuard>
              </>
            )}
          </main>
          <SupportChatWidget />
        </div>
        </OrgProvider>
      </DemoProvider>
    </LangProvider>
  )
}
