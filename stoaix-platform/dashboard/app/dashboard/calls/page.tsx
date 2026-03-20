import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { t } from '@/lib/i18n'
import { formatDuration } from '@/lib/types'
import CallRow from './CallRow'

export default async function CallsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orgUser } = await supabase
    .from('org_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: superAdmin } = await supabase
    .from('super_admin_users')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  let orgId: string | null = orgUser?.organization_id ?? null
  if (superAdmin && !orgId) {
    const { data: firstOrg } = await supabase.from('organizations').select('id').eq('status', 'active').limit(1).maybeSingle()
    orgId = firstOrg?.id ?? null
  }

  if (!orgId) return <div className="p-8 text-slate-500">Organizasyon bulunamadı.</div>

  const { data: calls } = await supabase
    .from('voice_calls')
    .select('id, phone_from, phone_to, direction, duration_seconds, status, started_at, transcript')
    .eq('organization_id', orgId)
    .order('started_at', { ascending: false })
    .limit(100)

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-slate-900 mb-6">{t.callsTitle}</h1>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.phone}</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.direction}</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.duration}</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.status}</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.date}</th>
              <th className="w-8 px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {(calls ?? []).length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400">{t.noData}</td></tr>
            ) : (calls ?? []).map((call: any) => (
              <CallRow key={call.id} call={call} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
