import { createClient } from '@/lib/supabase/server';
import AdminRequestCard from '@/components/admin/AdminRequestCard';
import { Clock, CheckCircle, XCircle, LayoutList, Building2 } from 'lucide-react';

type StatusTab = 'pending' | 'approved' | 'rejected';

interface PageProps {
  searchParams: { status?: StatusTab; clinic?: string };
}

export default async function AdminPage({ searchParams }: PageProps) {
  const supabase = createClient();
  const activeTab: StatusTab = searchParams.status ?? 'pending';
  const activeClinic = searchParams.clinic ?? 'all';

  // Tüm klinikleri getir (admin tümünü görebilir)
  const { data: clinics } = await supabase
    .from('clinics')
    .select('id, name, slug')
    .eq('status', 'active')
    .order('name');

  // İstekler — clinic filtresi
  let reqQuery = supabase
    .from('kb_change_requests')
    .select(`*, clinic:clinic_id (name, slug)`)
    .eq('status', activeTab)
    .order('created_at', { ascending: false })
    .limit(100);

  if (activeClinic !== 'all') {
    reqQuery = reqQuery.eq('clinic_id', activeClinic);
  }

  const { data: requests } = await reqQuery;

  // Sayaçlar — clinic filtreli
  async function getCount(status: string, clinicId?: string) {
    let q = supabase
      .from('kb_change_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);
    if (clinicId && clinicId !== 'all') q = q.eq('clinic_id', clinicId);
    const { count } = await q;
    return count ?? 0;
  }

  const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
    getCount('pending', activeClinic),
    getCount('approved', activeClinic),
    getCount('rejected', activeClinic),
  ]);

  // Her klinik için bekleyen istek sayısı (sidebar badge)
  const { data: pendingPerClinic } = await supabase
    .from('kb_change_requests')
    .select('clinic_id')
    .eq('status', 'pending');

  const clinicPendingMap = (pendingPerClinic ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.clinic_id] = (acc[r.clinic_id] ?? 0) + 1;
    return acc;
  }, {});

  const totalPending = pendingPerClinic?.length ?? 0;

  const tabs = [
    { key: 'pending',   label: 'Bekleyenler',   count: pendingCount,  icon: Clock,        color: 'text-amber-600' },
    { key: 'approved',  label: 'Onaylananlar',  count: approvedCount, icon: CheckCircle,  color: 'text-emerald-600' },
    { key: 'rejected',  label: 'Reddedilenler', count: rejectedCount, icon: XCircle,      color: 'text-red-600' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">KB Değişiklik İstekleri</h1>
          <p className="text-slate-500 text-sm mt-1">
            Kliniklerin önerdiği güncellemeleri incele ve onayla
          </p>
        </div>
        {totalPending > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">
              {totalPending} toplam bekleyen
            </span>
          </div>
        )}
      </div>

      {/* Klinik filtresi */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-700">Klinik Filtresi</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/admin?status=${activeTab}&clinic=all`}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
              activeClinic === 'all'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            Tüm Klinikler
            {totalPending > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeClinic === 'all' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
              }`}>
                {totalPending}
              </span>
            )}
          </a>

          {(clinics ?? []).map((clinic) => {
            const pending = clinicPendingMap[clinic.id] ?? 0;
            const isActive = activeClinic === clinic.id;
            return (
              <a
                key={clinic.id}
                href={`/admin?status=${activeTab}&clinic=${clinic.id}`}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                  isActive
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:text-brand-600'
                }`}
              >
                {clinic.name}
                {pending > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {pending}
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
              href={`/admin?status=${tab.key}&clinic=${activeClinic}`}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white shadow-sm border border-slate-200 text-slate-900'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? tab.color : 'text-slate-400'}`} />
              {tab.label}
              {(tab.count ?? 0) > 0 && (
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

      {/* Request list */}
      {(requests ?? []).length === 0 ? (
        <div className="card p-16 text-center">
          <LayoutList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">
            {activeTab === 'pending'
              ? activeClinic === 'all'
                ? 'Bekleyen istek yok 🎉'
                : 'Bu klinikten bekleyen istek yok'
              : 'Bu kategoride istek bulunmuyor'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {(requests ?? []).map((req) => (
            <AdminRequestCard key={req.id} request={req} />
          ))}
        </div>
      )}
    </div>
  );
}
