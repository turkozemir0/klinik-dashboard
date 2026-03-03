import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LeadScoreBadge from '@/components/dashboard/LeadScoreBadge';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Search } from 'lucide-react';
import HandoffButton from '@/components/dashboard/HandoffButton';

type StatusFilter = 'all' | 'active' | 'handed_off' | 'closed';
type TierFilter = 'all' | 'hot' | 'warm' | 'cold';

interface PageProps {
  searchParams: {
    status?: StatusFilter;
    tier?: TierFilter;
    q?: string;
  };
}

async function getClinicId(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data } = await supabase.from('clinic_users').select('clinic_id').eq('user_id', userId).single();
  return data?.clinic_id as string | undefined;
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const clinicId = await getClinicId(supabase, user.id);
  if (!clinicId) redirect('/login');

  const statusFilter = searchParams.status ?? 'all';
  const tierFilter = searchParams.tier ?? 'all';
  const query = searchParams.q ?? '';

  // Build Supabase query
  let dbQuery = supabase
    .from('conversations')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('last_message_at', { ascending: false });

  if (statusFilter !== 'all') {
    dbQuery = dbQuery.eq('status', statusFilter);
  }

  if (tierFilter === 'hot') {
    dbQuery = dbQuery.gte('lead_score', 70);
  } else if (tierFilter === 'warm') {
    dbQuery = dbQuery.gte('lead_score', 40).lt('lead_score', 70);
  } else if (tierFilter === 'cold') {
    dbQuery = dbQuery.lt('lead_score', 40);
  }

  const { data: conversations } = await dbQuery.limit(100);

  // Client-side text filter (name/phone/service)
  const filtered = (conversations ?? []).filter((c) => {
    if (!query) return true;
    const q = query.toLowerCase();
    const service = (c.collected_data as { interested_service?: string })?.interested_service ?? '';
    return (
      c.contact_name?.toLowerCase().includes(q) ||
      c.contact_phone?.includes(q) ||
      service.toLowerCase().includes(q)
    );
  });

  const statusLabels: Record<string, string> = {
    active: 'Aktif',
    handed_off: 'Handoff',
    closed: 'Kapalı',
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lead Pipeline</h1>
          <p className="text-slate-500 text-sm mt-1">{filtered.length} lead gösteriliyor</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <form className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="İsim, telefon veya hizmet ara…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {(['all', 'active', 'handed_off', 'closed'] as StatusFilter[]).map((s) => (
              <a
                key={s}
                href={`/dashboard/leads?status=${s}&tier=${tierFilter}&q=${query}`}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  statusFilter === s
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {s === 'all' ? 'Tümü' : statusLabels[s] ?? s}
              </a>
            ))}
          </div>

          {/* Tier filter */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {(['all', 'hot', 'warm', 'cold'] as TierFilter[]).map((t) => (
              <a
                key={t}
                href={`/dashboard/leads?status=${statusFilter}&tier=${t}&q=${query}`}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  tierFilter === t
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t === 'all' ? 'Tümü' : t.toUpperCase()}
              </a>
            ))}
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Hasta</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Hizmet</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Skor</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Durum</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Handoff</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Aşama</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Son Mesaj</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    Filtrelerle eşleşen lead bulunamadı
                  </td>
                </tr>
              ) : (
                filtered.map((conv) => {
                  const service = (conv.collected_data as { interested_service?: string })?.interested_service;
                  const name = conv.contact_name ?? conv.contact_phone;
                  const lastMsg = conv.last_message_at
                    ? format(parseISO(conv.last_message_at), "d MMM HH:mm", { locale: tr })
                    : '—';

                  return (
                    <tr key={conv.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-brand-700">
                              {name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{name}</p>
                            {conv.contact_name && (
                              <p className="text-xs text-slate-400">{conv.contact_phone}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {service ?? <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <LeadScoreBadge score={conv.lead_score} size="sm" />
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={
                          conv.status === 'active' ? 'badge-active' :
                          conv.status === 'handed_off' ? 'badge-warm' :
                          'badge-closed'
                        }>
                          {statusLabels[conv.status] ?? conv.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <HandoffButton
                          conversationId={conv.id}
                          alreadyHandedOff={conv.handoff_triggered || conv.status === 'handed_off'}
                        />
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500 font-mono">
                        {conv.current_stage}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-400 tabular-nums">
                        {lastMsg}
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
