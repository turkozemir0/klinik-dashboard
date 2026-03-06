import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getLang, getT } from '@/lib/i18n';
import { BarChart3, TrendingUp, ArrowRightLeft } from 'lucide-react';

async function getClinicId(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data } = await supabase.from('clinic_users').select('clinic_id').eq('user_id', userId).single();
  return data?.clinic_id as string | undefined;
}

export default async function ServicesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const clinicId = await getClinicId(supabase, user.id);
  if (!clinicId) redirect('/login');

  const lang = getLang();
  const t = getT(lang);

  const { data: perfRows } = await supabase
    .from('service_performance')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('total_leads', { ascending: false });

  const { data: services } = await supabase
    .from('services')
    .select('service_key, display_name, category')
    .eq('clinic_id', clinicId)
    .eq('is_active', true);

  const serviceMap = Object.fromEntries(
    (services ?? []).map((s) => [s.service_key, s])
  );

  const totalLeads = (perfRows ?? []).reduce((a, r) => a + (r.total_leads ?? 0), 0);
  const totalHandoffs = (perfRows ?? []).reduce((a, r) => a + (r.handoffs ?? 0), 0);
  const avgConvRate = (perfRows ?? []).length > 0
    ? Math.round(
        (perfRows ?? []).reduce((a, r) => a + (r.conversion_rate_pct ?? 0), 0) / (perfRows?.length ?? 1)
      )
    : 0;

  const maxLeads = Math.max(...(perfRows ?? []).map((r) => r.total_leads ?? 0), 1);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t.services.title}</h1>
        <p className="text-slate-500 text-sm mt-1">{t.services.subtitle}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">{t.services.serviceCategories}</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{perfRows?.length ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">{t.services.totalLeads}</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{totalLeads}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">{t.services.avgConversion}</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{avgConvRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Visual bar chart */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-5">{t.services.leadDistributionByService}</h2>
        {(perfRows ?? []).length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">{t.services.noData}</p>
        ) : (
          <div className="space-y-4">
            {(perfRows ?? []).map((row) => {
              const svc = serviceMap[row.service];
              const displayName = svc?.display_name ?? row.service;
              const pct = Math.round((row.total_leads / maxLeads) * 100);

              return (
                <div key={row.service} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-800">{displayName}</span>
                      {svc?.category && (
                        <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                          {svc.category}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-slate-900 tabular-nums">
                      {row.total_leads} {t.services.leads}
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detailed table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">{t.services.detailedPerformance}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.services.service}</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.services.category}</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.services.leadsCol}</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.services.avgScore}</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.services.handoffs}</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.services.conversionPct}</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.services.quality}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(perfRows ?? []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    {t.services.noTableData}
                  </td>
                </tr>
              ) : (
                (perfRows ?? []).map((row) => {
                  const svc = serviceMap[row.service];
                  const displayName = svc?.display_name ?? row.service;
                  const conv = row.conversion_rate_pct ?? 0;
                  const avgScore = row.avg_score ?? 0;

                  return (
                    <tr key={row.service} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-slate-900">{displayName}</td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs">
                        {svc?.category ?? <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-slate-900">
                        {row.total_leads}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums">
                        <span className={
                          avgScore >= 70 ? 'text-red-600 font-semibold' :
                          avgScore >= 40 ? 'text-amber-600 font-semibold' :
                          'text-slate-500'
                        }>
                          {avgScore}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-slate-700">
                        {row.handoffs}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`font-semibold tabular-nums ${
                          conv >= 50 ? 'text-emerald-600' :
                          conv >= 25 ? 'text-amber-600' :
                          'text-slate-500'
                        }`}>
                          {conv}%
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                avgScore >= 70 ? 'bg-red-500' :
                                avgScore >= 40 ? 'bg-amber-500' :
                                'bg-blue-400'
                              }`}
                              style={{ width: `${Math.min(avgScore, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400">
                            {avgScore >= 70 ? t.services.high : avgScore >= 40 ? t.services.medium : t.services.low}
                          </span>
                        </div>
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
