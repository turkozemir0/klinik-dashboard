import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getLang, getT, getDateLocale } from '@/lib/i18n-server';
import { format, parseISO } from 'date-fns';
import { Phone, PhoneIncoming, PhoneOutgoing } from 'lucide-react';

async function getClinicId(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data } = await supabase.from('clinic_users').select('clinic_id').eq('user_id', userId).single();
  return data?.clinic_id as string | undefined;
}

function formatDuration(seconds: number | null) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}d ${s}s` : `${s}s`;
}

export default async function CallsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const clinicId = await getClinicId(supabase, user.id);
  if (!clinicId) redirect('/login');

  const lang = getLang();
  const t = getT(lang);
  const dateLocale = getDateLocale(lang);

  const { data: calls } = await supabase
    .from('voice_calls')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('started_at', { ascending: false })
    .limit(100);

  const rows = calls ?? [];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.calls.title}</h1>
          <p className="text-slate-500 text-sm mt-1">{t.calls.callsShown(rows.length)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {t.calls.caller}
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {t.calls.duration}
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {t.calls.date}
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {t.calls.transcript}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-slate-400">
                    {t.calls.noCallLogs}
                  </td>
                </tr>
              ) : (
                rows.map((call) => {
                  const isInbound = call.direction !== 'outbound';
                  const caller = call.phone_from || '—';
                  const date = call.started_at
                    ? format(parseISO(call.started_at), 'd MMM yyyy HH:mm', { locale: dateLocale })
                    : '—';

                  return (
                    <tr key={call.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isInbound ? 'bg-emerald-100' : 'bg-brand-100'
                          }`}>
                            {isInbound
                              ? <PhoneIncoming className="w-4 h-4 text-emerald-600" />
                              : <PhoneOutgoing className="w-4 h-4 text-brand-600" />
                            }
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{caller}</p>
                            <p className="text-xs text-slate-400">
                              {isInbound ? t.calls.inbound : t.calls.outbound}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 tabular-nums">
                        {formatDuration(call.duration_seconds)}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-400 tabular-nums">
                        {date}
                      </td>
                      <td className="px-5 py-3.5">
                        {call.transcript ? (
                          <details className="group">
                            <summary className="cursor-pointer text-brand-600 hover:text-brand-700 text-xs font-medium list-none flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {t.calls.viewTranscript}
                            </summary>
                            <pre className="mt-2 text-xs text-slate-600 whitespace-pre-wrap bg-slate-50 rounded-lg p-3 max-w-lg max-h-48 overflow-y-auto">
                              {call.transcript}
                            </pre>
                          </details>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
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
