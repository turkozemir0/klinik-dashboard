import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Users, Flame, TrendingUp, ArrowRight, Star, CalendarDays } from 'lucide-react'
import StatCard from '@/components/StatCard'
import TrendChart from '@/components/TrendChart'
import LeadBadge from '@/components/LeadBadge'
import { t } from '@/lib/i18n'
import { formatDuration } from '@/lib/types'
import type { DailyTrend } from '@/lib/types'
import Link from 'next/link'

async function getOrgId(supabase: any, userId: string) {
  const { data: superAdmin } = await supabase
    .from('super_admin_users')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (superAdmin) {
    // Super admin: use first active org or null for all
    const { data: firstOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()
    return firstOrg?.id ?? null
  }

  const { data: orgUser } = await supabase
    .from('org_users')
    .select('organization_id')
    .eq('user_id', userId)
    .maybeSingle()

  return orgUser?.organization_id ?? null
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orgId = await getOrgId(supabase, user.id)
  if (!orgId) {
    return (
      <div className="p-8 text-slate-500">Organizasyon bulunamadı.</div>
    )
  }

  // Fetch all stats in parallel
  const [leadsResult, handoffResult, todayResult, trendResult, recentLeadsResult, recentCallsResult] = await Promise.all([
    supabase
      .from('leads')
      .select('id, qualification_score, status, created_at')
      .eq('organization_id', orgId),
    supabase
      .from('handoff_logs')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId),
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    // Daily trend last 14 days
    supabase.rpc('get_dashboard_trend', { p_org_id: orgId, p_days: 14 }),
    // Recent 5 leads with contacts
    supabase
      .from('leads')
      .select('id, qualification_score, status, source_channel, collected_data, created_at, contact:contacts(id, full_name, phone)')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(5),
    // Recent 5 calls
    supabase
      .from('voice_calls')
      .select('id, phone_from, direction, duration_seconds, started_at, status')
      .eq('organization_id', orgId)
      .order('started_at', { ascending: false })
      .limit(5),
  ])

  const leads = leadsResult.data ?? []
  const totalLeads = leads.length
  const hotLeads = leads.filter(l => l.qualification_score >= 70).length
  const warmLeads = leads.filter(l => l.qualification_score >= 40 && l.qualification_score < 70).length
  const coldLeads = leads.filter(l => l.qualification_score < 40).length
  const avgScore = totalLeads > 0 ? Math.round(leads.reduce((s, l) => s + l.qualification_score, 0) / totalLeads) : 0
  const totalHandoffs = handoffResult.count ?? 0
  const todayNew = todayResult.count ?? 0

  // Build trend data — fallback if RPC doesn't exist
  let trendData: DailyTrend[] = []
  if (trendResult.data && Array.isArray(trendResult.data)) {
    trendData = trendResult.data
  } else {
    // Simple fallback: generate last 14 days with 0s
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      trendData.push({
        date: d.toISOString().split('T')[0],
        conversations: 0,
        hot_leads: 0,
        handoffs: 0,
      })
    }
  }

  const recentLeads = recentLeadsResult.data ?? []
  const recentCalls = recentCallsResult.data ?? []

  const handoffRate = totalLeads > 0 ? Math.round((totalHandoffs / totalLeads) * 100) : 0

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{t.dashboardTitle}</h1>
        <p className="text-sm text-slate-500 mt-0.5">Genel performans özeti</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title={t.totalLeads} value={totalLeads} icon={Users} color="blue" />
        <StatCard title={t.hotLeads} value={hotLeads} icon={Flame} color="red" />
        <StatCard title={t.warmLeads} value={warmLeads} icon={TrendingUp} color="amber" />
        <StatCard title={t.handoffs} value={totalHandoffs} icon={ArrowRight} color="purple" />
        <StatCard title={t.avgScore} value={avgScore} icon={Star} color="green" subtitle="/ 100" />
        <StatCard title={t.todayNew} value={todayNew} icon={CalendarDays} color="slate" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Trend chart */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">{t.last14Days}</h2>
          <TrendChart data={trendData} />
        </div>

        {/* Distribution + Handoff rate */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">{t.leadDistribution}</h2>
            <div className="space-y-2.5">
              {[
                { label: 'HOT', count: hotLeads, color: 'bg-red-500', pct: totalLeads > 0 ? Math.round(hotLeads / totalLeads * 100) : 0 },
                { label: 'WARM', count: warmLeads, color: 'bg-amber-400', pct: totalLeads > 0 ? Math.round(warmLeads / totalLeads * 100) : 0 },
                { label: 'COLD', count: coldLeads, color: 'bg-blue-400', pct: totalLeads > 0 ? Math.round(coldLeads / totalLeads * 100) : 0 },
              ].map(({ label, count, color, pct }) => (
                <div key={label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{label}</span>
                    <span className="text-slate-500">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-2">{t.handoffRate}</h2>
            <p className="text-4xl font-bold text-slate-900">{handoffRate}<span className="text-lg text-slate-400">%</span></p>
            <p className="text-xs text-slate-400 mt-1">{totalHandoffs} / {totalLeads} lead</p>
          </div>
        </div>
      </div>

      {/* Recent rows */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Recent Leads */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
            <h2 className="text-sm font-semibold text-slate-700">{t.recentConversations}</h2>
            <Link href="/dashboard/conversations" className="text-xs text-brand-500 hover:text-brand-600 font-medium">
              Tümü &rarr;
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentLeads.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400">{t.noData}</p>
            ) : recentLeads.map((lead: any) => (
              <Link
                key={lead.id}
                href={`/dashboard/conversations/${lead.id}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-600 flex-shrink-0">
                  {(lead.contact?.full_name || lead.contact?.phone || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {lead.contact?.full_name || lead.contact?.phone || 'Bilinmeyen'}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {lead.collected_data?.target_country || lead.collected_data?.city || lead.source_channel}
                  </p>
                </div>
                <LeadBadge score={lead.qualification_score} />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Calls */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
            <h2 className="text-sm font-semibold text-slate-700">{t.recentCalls}</h2>
            <Link href="/dashboard/calls" className="text-xs text-brand-500 hover:text-brand-600 font-medium">
              Tümü &rarr;
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentCalls.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400">{t.noData}</p>
            ) : recentCalls.map((call: any) => (
              <div key={call.id} className="flex items-center gap-3 px-5 py-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${call.status === 'completed' ? 'bg-green-400' : 'bg-red-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{call.phone_from || '—'}</p>
                  <p className="text-xs text-slate-400">
                    {call.direction === 'inbound' ? t.inbound : t.outbound} · {formatDuration(call.duration_seconds)}
                  </p>
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0">
                  {new Date(call.started_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
