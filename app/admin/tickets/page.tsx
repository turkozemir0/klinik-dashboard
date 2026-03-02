import { createClient } from '@/lib/supabase/server';
import AdminTicketCard from '@/components/admin/AdminTicketCard';
import { LifeBuoy, Clock, Loader, CheckCircle, Building2 } from 'lucide-react';

type StatusTab = 'open' | 'in_progress' | 'resolved';

interface PageProps {
  searchParams: { status?: StatusTab; clinic?: string };
}

export default async function AdminTicketsPage({ searchParams }: PageProps) {
  const supabase = createClient();
  const activeTab: StatusTab = searchParams.status ?? 'open';
  const activeClinic = searchParams.clinic ?? 'all';

  // Klinikleri getir
  const { data: clinics } = await supabase
    .from('clinics')
    .select('id, name')
    .eq('status', 'active')
    .order('name');

  // Ticketları getir
  let query = supabase
    .from('support_tickets')
    .select(`*, clinic:clinic_id (name)`)
    .eq('status', activeTab)
    .order('created_at', { ascending: false })
    .limit(100);

  if (activeClinic !== 'all') {
    query = query.eq('clinic_id', activeClinic);
  }

  const { data: tickets } = await query;

  // Sayaçlar
  async function getCount(status: string, clinicId?: string) {
    let q = supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);
    if (clinicId && clinicId !== 'all') q = q.eq('clinic_id', clinicId);
    const { count } = await q;
    return count ?? 0;
  }

  const [openCount, inProgressCount, resolvedCount] = await Promise.all([
    getCount('open', activeClinic),
    getCount('in_progress', activeClinic),
    getCount('resolved', activeClinic),
  ]);

  // Klinik başına bekleyen ticket
  const { data: openPerClinic } = await supabase
    .from('support_tickets')
    .select('clinic_id')
    .in('status', ['open', 'in_progress']);

  const clinicTicketMap = (openPerClinic ?? []).reduce<Record<string, number>>((acc, t) => {
    acc[t.clinic_id] = (acc[t.clinic_id] ?? 0) + 1;
    return acc;
  }, {});

  const tabs = [
    { key: 'open',        label: 'Açık',    count: openCount,       icon: Clock,        color: 'text-amber-600' },
    { key: 'in_progress', label: 'İşlemde', count: inProgressCount, icon: Loader,       color: 'text-blue-600' },
    { key: 'resolved',    label: 'Çözüldü', count: resolvedCount,   icon: CheckCircle,  color: 'text-emerald-600' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <LifeBuoy className="w-6 h-6 text-brand-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Destek Talepleri</h1>
          <p className="text-slate-500 text-sm mt-0.5">Kliniklerin destek taleplerini yönet</p>
        </div>
      </div>

      {/* Klinik filtresi */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-700">Klinik</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/admin/tickets?status=${activeTab}&clinic=all`}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              activeClinic === 'all'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            Tümü
          </a>
          {(clinics ?? []).map((c) => {
            const count = clinicTicketMap[c.id] ?? 0;
            return (
              <a
                key={c.id}
                href={`/admin/tickets?status=${activeTab}&clinic=${c.id}`}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  activeClinic === c.id
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'
                }`}
              >
                {c.name}
                {count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                    activeClinic === c.id ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {count}
                  </span>
                )}
              </a>
            );
          })}
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <a
              key={tab.key}
              href={`/admin/tickets?status=${tab.key}&clinic=${activeClinic}`}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white shadow-sm border border-slate-200 text-slate-900'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? tab.color : 'text-slate-400'}`} />
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-slate-100 text-slate-700' : 'bg-slate-200/70 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </a>
          );
        })}
      </div>

      {/* Ticket listesi */}
      {(tickets ?? []).length === 0 ? (
        <div className="card p-16 text-center">
          <LifeBuoy className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Bu kategoride ticket yok</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(tickets ?? []).map((ticket) => (
            <AdminTicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  );
}
