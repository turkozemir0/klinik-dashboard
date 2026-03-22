import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Send, Clock, AlertCircle, CalendarDays, MessageCircle } from 'lucide-react'
import StatCard from '@/components/StatCard'

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getOrgId(supabase: any, userId: string) {
  const { data: superAdmin } = await supabase
    .from('super_admin_users').select('id').eq('user_id', userId).maybeSingle()
  if (superAdmin) {
    const { data: firstOrg } = await supabase
      .from('organizations').select('id').eq('status', 'active').limit(1).maybeSingle()
    return firstOrg?.id ?? null
  }
  const { data: orgUser } = await supabase
    .from('org_users').select('organization_id').eq('user_id', userId).maybeSingle()
  return orgUser?.organization_id ?? null
}

const STAGE_LABELS: Record<string, string> = {
  first_reminder: 'İlk Hatırlatma',
  warm_day4:      'Gün 4 (Warm)',
  warm_day11:     'Gün 11 (Warm)',
  warm_to_cold:   'Soğuyor (G14)',
  cold_month1:    '1. Ay (Cold)',
  cold_month2:    '2. Ay (Cold)',
  cold_final:     'Son Deneme',
  re_contact_1:   'İlk Temas',
  re_contact_2:   '2. Temas',
  re_contact_3:   'Son Temas',
}

const ORGANIC_STAGES = ['first_reminder','warm_day4','warm_day11','warm_to_cold','cold_month1','cold_month2','cold_final']
const REENGAGEMENT_STAGES = ['re_contact_1','re_contact_2','re_contact_3']

function StageBar({ row }: { row: any }) {
  const total = (row.pending ?? 0) + (row.sent ?? 0) + (row.done ?? 0) + (row.cancelled ?? 0)
  if (total === 0) return null
  const sentPct     = Math.round((row.sent     / total) * 100)
  const donePct     = Math.round((row.done     / total) * 100)
  const cancelPct   = Math.round((row.cancelled/ total) * 100)
  const pendingPct  = 100 - sentPct - donePct - cancelPct

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-medium text-slate-700">{STAGE_LABELS[row.stage] ?? row.stage}</span>
        <span className="text-slate-400">{total} toplam</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
        {donePct     > 0 && <div className="h-full bg-green-400"  style={{ width: `${donePct}%` }} title={`Done: ${row.done}`} />}
        {sentPct     > 0 && <div className="h-full bg-blue-400"   style={{ width: `${sentPct}%` }} title={`Sent: ${row.sent}`} />}
        {pendingPct  > 0 && <div className="h-full bg-amber-300"  style={{ width: `${pendingPct}%` }} title={`Pending: ${row.pending}`} />}
        {cancelPct   > 0 && <div className="h-full bg-slate-300"  style={{ width: `${cancelPct}%` }} title={`Cancelled: ${row.cancelled}`} />}
      </div>
      <div className="flex gap-3 mt-1 text-[10px] text-slate-400">
        {row.pending   > 0 && <span className="text-amber-500">⏳ {row.pending} bekliyor</span>}
        {row.sent      > 0 && <span className="text-blue-500">✉ {row.sent} gönderildi</span>}
        {row.done      > 0 && <span className="text-green-500">✓ {row.done} tamamlandı</span>}
        {row.cancelled > 0 && <span>✕ {row.cancelled} iptal</span>}
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function FollowupPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orgId = await getOrgId(supabase, user.id)
  if (!orgId) return <div className="p-8 text-slate-500">Organizasyon bulunamadı.</div>

  const [statsResult, upcomingResult] = await Promise.all([
    supabase.rpc('get_followup_stats',    { p_org_id: orgId }),
    supabase.rpc('get_upcoming_followups', { p_org_id: orgId, p_limit: 20 }),
  ])

  const stats    = statsResult.data    ?? {}
  const upcoming = upcomingResult.data ?? []

  const byStage:    any[] = stats.by_stage    ?? []
  const recentSent: any[] = stats.recent_sent ?? []

  const organicRows     = byStage.filter((r: any) => ORGANIC_STAGES.includes(r.stage))
  const reengageRows    = byStage.filter((r: any) => REENGAGEMENT_STAGES.includes(r.stage))

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Follow-up Takibi</h1>
        <p className="text-sm text-slate-500 mt-0.5">Otomatik mesaj dizisi performansı</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="7 Günde Gönderilecek" value={stats.upcoming_7_days ?? 0} icon={CalendarDays} color="blue" />
        <StatCard title="Bugün Gönderilen"      value={stats.sent_today      ?? 0} icon={Send}         color="green" />
        <StatCard title="Gecikmiş"              value={stats.overdue         ?? 0} icon={AlertCircle}  color="red" />
        <StatCard title="Aktif Sequence"
          value={byStage.reduce((s: number, r: any) => s + (r.pending ?? 0), 0)}
          icon={Clock} color="amber"
        />
      </div>

      {/* Funnel + Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Funnel */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-5">
          <h2 className="text-sm font-semibold text-slate-700">Sequence Hunisi</h2>

          {/* Organik */}
          {organicRows.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Organik Follow-up</p>
              {organicRows.map((row: any) => <StageBar key={row.stage} row={row} />)}
            </div>
          )}

          {/* Re-engagement */}
          {reengageRows.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Re-engagement (CRM Import)</p>
              {reengageRows.map((row: any) => <StageBar key={row.stage} row={row} />)}
            </div>
          )}

          {byStage.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">Henüz follow-up verisi yok.</p>
          )}

          {/* Legend */}
          <div className="flex gap-4 text-[10px] text-slate-400 pt-1 border-t border-slate-50">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-400 inline-block" /> Tamamlandı</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-400 inline-block" /> Gönderildi</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-300 inline-block" /> Bekliyor</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-slate-300 inline-block" /> İptal</span>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50">
            <h2 className="text-sm font-semibold text-slate-700">Son Gönderilen Mesajlar</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {recentSent.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400">Henüz gönderilmiş mesaj yok.</p>
            ) : recentSent.map((item: any) => (
              <div key={item.id} className="px-5 py-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-700">{item.phone ?? '—'}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      REENGAGEMENT_STAGES.includes(item.sequence_stage)
                        ? 'bg-purple-50 text-purple-600'
                        : 'bg-blue-50 text-blue-600'
                    }`}>
                      {STAGE_LABELS[item.sequence_stage] ?? item.sequence_stage}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 flex-shrink-0">
                    {item.sent_at
                      ? new Date(item.sent_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </span>
                </div>
                {item.preview && (
                  <p className="text-xs text-slate-500 line-clamp-1">{item.preview}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Tasks */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50">
          <h2 className="text-sm font-semibold text-slate-700">Yaklaşan Görevler</h2>
          <p className="text-xs text-slate-400 mt-0.5">Sıradaki 20 planlı mesaj</p>
        </div>

        {upcoming.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">Planlı görev yok.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 font-medium border-b border-slate-50">
                  <th className="px-5 py-3 text-left">Kişi</th>
                  <th className="px-5 py-3 text-left">Aşama</th>
                  <th className="px-5 py-3 text-left">Kanal</th>
                  <th className="px-5 py-3 text-left">Planlanan Zaman</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {upcoming.map((task: any) => {
                  const scheduledAt = new Date(task.scheduled_at)
                  const isOverdue   = scheduledAt < new Date()
                  return (
                    <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-slate-800">
                        {task.contact_phone ?? '—'}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          REENGAGEMENT_STAGES.includes(task.sequence_stage)
                            ? 'bg-purple-50 text-purple-600'
                            : 'bg-blue-50 text-blue-600'
                        }`}>
                          {STAGE_LABELS[task.sequence_stage] ?? task.sequence_stage}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-500 capitalize">{task.channel}</td>
                      <td className="px-5 py-3">
                        <span className={isOverdue ? 'text-red-500 font-medium' : 'text-slate-500'}>
                          {scheduledAt.toLocaleDateString('tr-TR', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                          {isOverdue && ' ⚠ Gecikmiş'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
