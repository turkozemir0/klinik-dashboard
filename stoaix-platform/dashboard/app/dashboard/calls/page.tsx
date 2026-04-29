import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getT } from '@/lib/i18n'
import { cookies } from 'next/headers'
import { Phone, PhoneIncoming, PhoneOff, Clock } from 'lucide-react'
import StatCard from '@/components/StatCard'
import Card from '@/components/Card'
import TopBar from '@/components/TopBar'
import CallRow from './CallRow'

export default async function CallsPage() {
  const lang = cookies().get('lang')?.value === 'en' ? 'en' : 'tr'
  const t = getT(lang)
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
    .select('id, phone_from, phone_to, direction, duration_seconds, status, started_at, transcript, lead_id, lead:leads(ai_summary, collected_data, qualification_score)')
    .eq('organization_id', orgId)
    .order('started_at', { ascending: false })
    .limit(100)

  const callList = calls ?? []

  // Compute stats
  const totalCalls = callList.length
  const answered = callList.filter(c => c.status === 'completed').length
  const missed = callList.filter(c => c.status === 'missed').length
  const answeredPct = totalCalls > 0 ? Math.round((answered / totalCalls) * 100) : 0
  const totalDuration = callList.reduce((s, c) => s + (c.duration_seconds ?? 0), 0)
  const avgDuration = answered > 0 ? Math.round(totalDuration / answered) : 0
  const avgMin = Math.floor(avgDuration / 60)
  const avgSec = avgDuration % 60

  return (
    <div className="p-6 space-y-6">
      <TopBar title={t.callsTitle} subtitle={lang === 'tr' ? `${totalCalls} arama kaydı` : `${totalCalls} call records`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={lang === 'tr' ? 'Toplam Arama' : 'Total Calls'} value={totalCalls} icon={Phone} color="blue" />
        <StatCard title={lang === 'tr' ? 'Cevaplanma' : 'Answered'} value={`${answeredPct}%`} icon={PhoneIncoming} color="green" />
        <StatCard title={lang === 'tr' ? 'Ort. Süre' : 'Avg Duration'} value={`${avgMin}:${avgSec.toString().padStart(2, '0')}`} icon={Clock} color="amber" />
        <StatCard title={lang === 'tr' ? 'Cevapsız' : 'Missed'} value={missed} icon={PhoneOff} color="red" />
      </div>

      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.phone}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.direction}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.duration}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.status}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Skor</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">{lang === 'tr' ? 'Özet' : 'Summary'}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.date}</th>
                <th className="w-8 px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {callList.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-400">{t.noData}</td></tr>
              ) : callList.map((call: any) => (
                <CallRow key={call.id} call={{ ...call, lead: Array.isArray(call.lead) ? call.lead[0] : call.lead }} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
