import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import LeadBadge from '@/components/LeadBadge'
import { t } from '@/lib/i18n'

export default async function ConversationsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get org id
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

  const { data: leads } = await supabase
    .from('leads')
    .select('id, qualification_score, status, source_channel, collected_data, created_at, contact:contacts(id, full_name, phone)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-slate-900 mb-6">{t.conversationsTitle}</h1>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kişi</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Hedef</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Skor</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.status}</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kanal</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.date}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {(leads ?? []).length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400">{t.noData}</td></tr>
            ) : (leads ?? []).map((lead: any) => (
              <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3">
                  <Link href={`/dashboard/conversations/${lead.id}`} className="hover:text-brand-600">
                    <p className="font-medium text-slate-800">{lead.contact?.full_name || '—'}</p>
                    <p className="text-xs text-slate-400">{lead.contact?.phone || '—'}</p>
                  </Link>
                </td>
                <td className="px-5 py-3 text-slate-600">
                  {lead.collected_data?.target_country || lead.collected_data?.city || '—'}
                </td>
                <td className="px-5 py-3">
                  <LeadBadge score={lead.qualification_score} />
                </td>
                <td className="px-5 py-3">
                  <LeadStatusBadge status={lead.status} />
                </td>
                <td className="px-5 py-3 text-slate-500 capitalize">{lead.source_channel}</td>
                <td className="px-5 py-3 text-slate-400 text-xs">
                  {new Date(lead.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LeadStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    new: 'bg-slate-100 text-slate-600',
    in_progress: 'bg-blue-100 text-blue-700',
    qualified: 'bg-green-100 text-green-700',
    handed_off: 'bg-purple-100 text-purple-700',
    lost: 'bg-red-100 text-red-700',
    converted: 'bg-emerald-100 text-emerald-700',
  }
  const labels: Record<string, string> = {
    new: t.new,
    in_progress: t.in_progress,
    qualified: t.qualified,
    handed_off: t.handed_off,
    lost: t.lost,
    converted: t.converted,
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-slate-100 text-slate-600'}`}>
      {labels[status] || status}
    </span>
  )
}
