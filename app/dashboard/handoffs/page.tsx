import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LeadScoreBadge from '@/components/dashboard/LeadScoreBadge';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

type OutcomeFilter = 'all' | 'pending' | 'converted' | 'lost' | 'no_answer';

interface PageProps {
  searchParams: { outcome?: OutcomeFilter };
}

async function getClinicId(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data } = await supabase.from('clinic_users').select('clinic_id').eq('user_id', userId).single();
  return data?.clinic_id as string | undefined;
}

const outcomeConfig = {
  pending:    { label: 'Beklemede', icon: Clock, class: 'text-amber-600 bg-amber-50', badge: 'badge-warm' },
  converted:  { label: 'Dönüştü', icon: CheckCircle, class: 'text-emerald-600 bg-emerald-50', badge: 'badge-active' },
  lost:       { label: 'Kaybedildi', icon: XCircle, class: 'text-red-600 bg-red-50', badge: 'badge-hot' },
  no_answer:  { label: 'Cevap Yok', icon: AlertCircle, class: 'text-slate-500 bg-slate-50', badge: 'badge-closed' },
};

export default async function HandoffLogsPage({ searchParams }: PageProps) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const clinicId = await getClinicId(supabase, user.id);
  if (!clinicId) redirect('/login');

  const outcomeFilter = searchParams.outcome ?? 'all';

  let dbQuery = supabase
    .from('handoff_logs')
    .select(`
      *,
      conversation:conversation_id (
        contact_name, contact_phone, collected_data
      )
    `)
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (outcomeFilter !== 'all') {
    dbQuery = dbQuery.eq('outcome', outcomeFilter);
  }

  const { data: logs } = await dbQuery;

  // Summary counts
  const allLogs = await supabase
    .from('handoff_logs')
    .select('outcome')
    .eq('clinic_id', clinicId);

  const counts = (allLogs.data ?? []).reduce<Record<string, number>>((acc, l) => {
    acc[l.outcome] = (acc[l.outcome] ?? 0) + 1;
    return acc;
  }, {});

  const conversionRate = (allLogs.data?.length ?? 0) > 0
    ? Math.round(((counts.converted ?? 0) / allLogs.data!.length) * 100)
    : 0;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Handoff Logları</h1>
        <p className="text-slate-500 text-sm mt-1">Satış ekibine iletilen leadlerin takibi</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(outcomeConfig).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <div key={key} className="card p-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cfg.class}`}>
                  <Icon className="w-4.5 h-4.5" size={18} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{cfg.label}</p>
                  <p className="text-xl font-bold text-slate-900 tabular-nums">{counts[key] ?? 0}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Conversion highlight */}
      <div className="card p-5 bg-gradient-to-r from-brand-50 to-white border-brand-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">Toplam Dönüşüm Oranı</p>
            <p className="text-3xl font-bold text-brand-700 mt-1 tabular-nums">{conversionRate}%</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">{counts.converted ?? 0} dönüştü</p>
            <p className="text-xs text-slate-400">{allLogs.data?.length ?? 0} toplam handoff</p>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {(['all', ...Object.keys(outcomeConfig)] as OutcomeFilter[]).map((o) => (
          <a
            key={o}
            href={`/dashboard/handoffs?outcome=${o}`}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              outcomeFilter === o
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {o === 'all' ? 'Tümü' : outcomeConfig[o as keyof typeof outcomeConfig].label}
            {o !== 'all' && counts[o] !== undefined && (
              <span className="ml-1 text-slate-400">({counts[o]})</span>
            )}
          </a>
        ))}
      </div>

      {/* Logs table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tarih</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Hasta</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Hizmet</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Skor</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tetikleyici</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Sonuç</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Not</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(logs ?? []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    Henüz handoff logu yok
                  </td>
                </tr>
              ) : (
                (logs ?? []).map((log) => {
                  const conv = log.conversation as {
                    contact_name?: string;
                    contact_phone?: string;
                    collected_data?: { interested_service?: string };
                  } | null;

                  const name = conv?.contact_name ?? conv?.contact_phone ?? log.ghl_contact_id;
                  const service = conv?.collected_data?.interested_service;
                  const cfg = outcomeConfig[log.outcome as keyof typeof outcomeConfig] ?? outcomeConfig.pending;
                  const Icon = cfg.icon;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 text-xs text-slate-500 tabular-nums whitespace-nowrap">
                        {format(parseISO(log.created_at), "d MMM yyyy HH:mm", { locale: tr })}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-900">{name}</p>
                        {conv?.contact_name && (
                          <p className="text-xs text-slate-400">{conv.contact_phone}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {service ?? <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        {log.lead_score_at_handoff != null ? (
                          <LeadScoreBadge score={log.lead_score_at_handoff} size="sm" />
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {log.trigger_type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Icon className={`w-3.5 h-3.5 ${cfg.class.split(' ')[0]}`} />
                          <span className={`text-xs font-medium ${cfg.class.split(' ')[0]}`}>
                            {cfg.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500 max-w-xs truncate">
                        {log.outcome_notes ?? <span className="text-slate-300">—</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
