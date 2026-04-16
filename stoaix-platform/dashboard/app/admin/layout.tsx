import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Sidebar from '@/components/Sidebar'
import { LangProvider } from '@/lib/lang-context'
import type { Lang } from '@/lib/i18n'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: superAdmin } = await supabase
    .from('super_admin_users')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!superAdmin) redirect('/dashboard')

  const cookieLang = cookies().get('lang')?.value as Lang | undefined
  const initialLang: Lang = cookieLang === 'en' ? 'en' : 'tr'

  return (
    <LangProvider initialLang={initialLang}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar orgName="stoaix Admin" isSuperAdmin />
        <main className="flex-1 min-w-0 overflow-auto">
          {children}
        </main>
      </div>
    </LangProvider>
  )
}
