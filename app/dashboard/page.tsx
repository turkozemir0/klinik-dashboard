import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import StatCard from '@/components/dashboard/StatCard';
import TrendChart from '@/components/dashboard/TrendChart';
import LeadScoreBadge from '@/components/dashboard/LeadScoreBadge';
import OnboardingBanner from '@/components/dashboard/OnboardingBanner';
import SupportButton from '@/components/dashboard/SupportButton';
import { getLang, getT, getDateLocale } from '@/lib/i18n-server';
import {
  Users,
  Flame,
  ArrowRightLeft,
  TrendingUp,
  MessageSquare,
  Clock,
  BookOpen,
  PhoneIncoming,
  Phone,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

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

  const lang = getLang();
  const t = getT(lang);
  const dateLocale = getDateLocale(lang);

  // ── Fetch all data in parallel ──────────────────────────────────────────────
  const [
    { data: conversations },
    { data: dailyStats },
    { data: recentConvs },
    { count: openTickets },
    { data: onboardingProg },
    { data: recentCalls },
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
    supabase
      .from('voice_calls')
      .select('id, phone_from, duration_seconds, started_at, direction')
      .eq('clinic_id', clinicId)
      .order('started_at', { ascending: false })
      .limit(5),
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

  const missingItems = onboardingProg ? [
    ...(!onboardingProg.profile_done   ? [t.onboarding.profile.title] : []),
    ...(!onboardingProg.services_done  ? [t.onboarding.steps.services] : []),
    ...(!onboardingProg.faqs_done      ? [t.onboarding.steps.faqs] : []),
  ] : [];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.overview.title}</h1>
          <p className="text-slate-500 text-sm mt-1">
            {format(new Date(), "d MMMM yyyy, EEEE", { locale: dateLocale })} · {t.overview.liveData}
          </p>
        </div>
        <SupportButton openTicketCount={openTickets ?? 0} />
      </div>

      {/* Onboarding banner — tamamlanmamışsa göster */}
      {onboardingProg && !onboardingProg.is_completed && (
        <OnboardingBanner
          completionPct={onboardingProg.completion_pct ?? 0}
          missingItems={missingItems}
        />
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title={t.overview.totalConversations}
          value={total}
          subtitle={t.overview.activeCount(active)}
          icon={MessageSquare}
          iconColor="text-brand-600"
          iconBg="bg-brand-50"
        />
        <StatCard
          title={t.overview.hotLead}
          value={hot}
          icon={Flame}
          iconColor="text-red-600"
          iconBg="bg-red-50"
        />
        <StatCard
          title={t.overview.warmLead}
          value={warm}
          icon={TrendingUp}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <StatCard
          title={t.overview.handoffsDone}
          value={handoffs}
          icon={ArrowRightLeft}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
        <StatCard
          title={t.overview.avgLeadScore}
          value={avgScore}
          icon={TrendingUp}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard
          title={t.overview.newToday}
          value={todayNew}
          subtitle={t.overview.handoffCount(todayHandoffs)}
          icon={Users}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
        />
      </div>

      {/* Charts + Recent conversations */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="card p-6 xl:col-span-2">
          <h2 className="text-base font-semibold text-slate-800 mb-1">{t.overview.dailyTrend}</h2>
          <p className="text-xs text-slate-400 mb-5">{t.overview.last14Days}</p>
          <TrendChart stats={dailyStats ?? []} />
        </div>

        {/* Lead dağılımı */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-5">{t.overview.leadDistribution}</h2>
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
              <span className="text-sm text-slate-500">{t.overview.handoffRate}</span>
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
          <h2 className="text-base font-semibold text-slate-800">{t.overview.recentConversations}</h2>
          <a href="/dashboard/leads" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
            {t.common.seeAll}
          </a>
        </div>
        <div className="divide-y divide-slate-50">
          {(recentConvs ?? []).length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              {t.overview.noConversations}
            </div>
          ) : (
            recentConvs!.map((conv) => {
              const name = conv.contact_name || conv.contact_phone;
              const service = (conv.collected_data as { interested_service?: string })?.interested_service;
              const lastMsg = conv.last_message_at
                ? format(parseISO(conv.last_message_at), "d MMM HH:mm", { locale: dateLocale })
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
                    <p className="text-xs text-slate-400 truncate">{service ?? t.overview.noService}</p>
                  </div>

                  {/* Score */}
                  <LeadScoreBadge score={conv.lead_score} size="sm" />

                  {/* Status */}
                  <span className={
                    conv.status === 'active' ? 'badge-active' :
                    conv.status === 'handed_off' ? 'badge-warm' :
                    'badge-closed'
                  }>
                    {conv.status === 'active' ? t.overview.statusActive :
                     conv.status === 'handed_off' ? t.overview.statusHandedOff : t.overview.statusClosed}
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

      {/* Recent Calls */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">{t.calls.title}</h2>
          <a href="/dashboard/calls" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
            {t.common.seeAll}
          </a>
        </div>
        <div className="divide-y divide-slate-50">
          {(recentCalls ?? []).length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">
              {t.calls.noCallLogs}
            </div>
          ) : (
            recentCalls!.map((call) => {
              const date = call.started_at
                ? format(parseISO(call.started_at), "d MMM HH:mm", { locale: dateLocale })
                : '—';
              const dur = call.duration_seconds
                ? `${Math.floor(call.duration_seconds / 60)}d ${call.duration_seconds % 60}s`
                : '—';

              return (
                <div key={call.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <PhoneIncoming className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{call.phone_from || '—'}</p>
                    <p className="text-xs text-slate-400">{call.direction === 'outbound' ? t.calls.outbound : t.calls.inbound}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 flex-shrink-0">
                    <Phone className="w-3 h-3" />
                    {dur}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400 flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    {date}
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
          <span>{t.sidebar.knowledgeBase}</span>
        </a>
      </div>
    </div>
  );
}
