import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import StatCard from '@/components/dashboard/StatCard';
import TrendChart from '@/components/dashboard/TrendChart';
import LeadScoreBadge from '@/components/dashboard/LeadScoreBadge';
import OnboardingBanner from '@/components/dashboard/OnboardingBanner';
import SupportButton from '@/components/dashboard/SupportButton';
import {
  Users,
  Flame,
  ArrowRightLeft,
  TrendingUp,
  MessageSquare,
  Clock,
  BookOpen,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

async function getClinicId(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data } = await supabase
    .from('clinic_users')
    .select('clinic_id')
    .eq('user_id', userId)
    .single();
  return data?.clinic_id as string | undefined;
}

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const clinicId = await getClinicId(supabase, user.id);
  if (!clinicId) redirect('/login');

  // ── Fetch all data in parallel ──────────────────────────────────────────────
  const [
    { data: conversations },
    { data: dailyStats },
    { data: recentConvs },
    { count: openTickets },
    { data: onboardingProg },
  ] = await Promise.all([
    supabase
      .from('conversations')
      .select('id, lead_score, status, handoff_triggered, images_received')
      .eq('clinic_id', clinicId),
    supabase
      .from('daily_stats')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('date', { ascending: false })
      .limit(14),
    supabase
      .from('conversations')
      .select('id, contact_name, contact_phone, lead_score, status, handoff_triggered, last_message_at, collected_data')
      .eq('clinic_id', clinicId)
      .order('last_message_at', { ascending: false })
      .limit(6),
    supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .in('status', ['open', 'in_progress']),
    supabase
      .from('onboarding_progress')
      .select('completion_pct, profile_done, services_done, faqs_done, is_completed')
      .eq('clinic_id', clinicId)
      .single(),
  ]);

  // ── Compute summary stats ───────────────────────────────────────────────────
  const total = conversations?.length ?? 0;
  const active = conversations?.filter((c) => c.status === 'active').length ?? 0;
  const hot = conversations?.filter((c) => c.lead_score >= 70).length ?? 0;
  const warm = conversations?.filter((c) => c.lead_score >= 40 && c.lead_score < 70).length ?? 0;
  const handoffs = conversations?.filter((c) => c.handoff_triggered).length ?? 0;
  const scores = conversations?.map((c) => c.lead_score).filter((s) => s > 0) ?? [];
  const avgScore = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  const today = dailyStats?.[0];
  const todayNew = today?.new_conversations ?? 0;
  const todayHandoffs = today?.handed_off_leads ?? 0;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Genel Bakış</h1>
          <p className="text-slate-500 text-sm mt-1">
            {format(new Date(), "d MMMM yyyy, EEEE", { locale: tr })} · Canlı Veriler
          </p>
        </div>
        <SupportButton openTicketCount={openTickets ?? 0} />
      </div>

      {/* Onboarding banner — tamamlanmamışsa göster */}
      {onboardingProg && !onboardingProg.is_completed && (
        <OnboardingBanner
          completionPct={onboardingProg.completion_pct ?? 0}
          missingItems={[
            ...(!onboardingProg.profile_done   ? ['Klinik profili'] : []),
            ...(!onboardingProg.services_done  ? ['En az 1 hizmet'] : []),
            ...(!onboardingProg.faqs_done      ? ['SSS'] : []),
          ]}
        />
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Toplam Konuşma"
          value={total}
          subtitle={`${active} aktif`}
          icon={MessageSquare}
          iconColor="text-brand-600"
          iconBg="bg-brand-50"
        />
        <StatCard
          title="Hot Lead (≥70)"
          value={hot}
          icon={Flame}
          iconColor="text-red-600"
          iconBg="bg-red-50"
        />
        <StatCard
          title="Warm Lead (40-69)"
          value={warm}
          icon={TrendingUp}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <StatCard
          title="Handoff Yapılan"
          value={handoffs}
          icon={ArrowRightLeft}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
        <StatCard
          title="Ort. Lead Skoru"
          value={avgScore}
          icon={TrendingUp}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard
          title="Bugün Yeni"
          value={todayNew}
          subtitle={`${todayHandoffs} handoff`}
          icon={Users}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
        />
      </div>

      {/* Charts + Recent conversations */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="card p-6 xl:col-span-2">
          <h2 className="text-base font-semibold text-slate-800 mb-1">Günlük Trend</h2>
          <p className="text-xs text-slate-400 mb-5">Son 14 gün</p>
          <TrendChart stats={dailyStats ?? []} />
        </div>

        {/* Lead dağılımı */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-5">Lead Dağılımı</h2>
          <div className="space-y-4">
            {[
              { label: 'HOT (≥70)', value: hot, total, color: 'bg-red-500', badge: 'badge-hot' },
              { label: 'WARM (40-69)', value: warm, total, color: 'bg-amber-500', badge: 'badge-warm' },
              { label: 'COLD (<40)', value: total - hot - warm, total, color: 'bg-blue-400', badge: 'badge-cold' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={item.badge}>{item.label}</span>
                  <span className="text-sm font-semibold text-slate-700 tabular-nums">
                    {item.value}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: item.total > 0 ? `${(item.value / item.total) * 100}%` : '0%' }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {item.total > 0 ? Math.round((item.value / item.total) * 100) : 0}%
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Handoff Oranı</span>
              <span className="text-sm font-bold text-slate-900">
                {total > 0 ? Math.round((handoffs / total) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Conversations */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">Son Konuşmalar</h2>
          <a href="/dashboard/leads" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
            Tümünü gör →
          </a>
        </div>
        <div className="divide-y divide-slate-50">
          {(recentConvs ?? []).length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Henüz konuşma yok
            </div>
          ) : (
            recentConvs!.map((conv) => {
              const name = conv.contact_name || conv.contact_phone;
              const service = (conv.collected_data as { interested_service?: string })?.interested_service;
              const lastMsg = conv.last_message_at
                ? format(parseISO(conv.last_message_at), "d MMM HH:mm", { locale: tr })
                : '—';

              return (
                <div key={conv.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-brand-700">
                      {name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Name + service */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{name}</p>
                    <p className="text-xs text-slate-400 truncate">{service ?? 'Hizmet belirtilmedi'}</p>
                  </div>

                  {/* Score */}
                  <LeadScoreBadge score={conv.lead_score} size="sm" />

                  {/* Status */}
                  <span className={
                    conv.status === 'active' ? 'badge-active' :
                    conv.status === 'handed_off' ? 'badge-warm' :
                    'badge-closed'
                  }>
                    {conv.status === 'active' ? 'Aktif' :
                     conv.status === 'handed_off' ? 'Handoff' : 'Kapalı'}
                  </span>

                  {/* Time */}
                  <div className="flex items-center gap-1 text-xs text-slate-400 flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    {lastMsg}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Subtle KB link — alt köşe */}
      <div className="flex justify-end pt-4">
        <a
          href="/dashboard/knowledge"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors group"
        >
          <BookOpen className="w-3.5 h-3.5 group-hover:text-brand-500 transition-colors" />
          <span>Knowledge Base</span>
        </a>
      </div>
    </div>
  );
}
