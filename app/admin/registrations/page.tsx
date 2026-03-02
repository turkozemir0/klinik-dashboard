import { createClient } from '@/lib/supabase/server';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Users, Clock, CheckCircle, XCircle, Building2, Phone, Mail, MapPin } from 'lucide-react';
import AdminRegistrationCard from '@/components/admin/AdminRegistrationCard';

type StatusTab = 'pending' | 'approved' | 'rejected';

interface PageProps {
  searchParams: { status?: StatusTab };
}

export default async function AdminRegistrationsPage({ searchParams }: PageProps) {
  const supabase = createClient();
  const activeTab: StatusTab = searchParams.status ?? 'pending';

  const { data: registrations } = await supabase
    .from('clinic_registrations')
    .select('*')
    .eq('status', activeTab)
    .order('created_at', { ascending: false });

  const [{ count: pendingCount }, { count: approvedCount }, { count: rejectedCount }] = await Promise.all([
    supabase.from('clinic_registrations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('clinic_registrations').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('clinic_registrations').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
  ]);

  const tabs = [
    { key: 'pending',  label: 'Bekleyenler',  count: pendingCount,  icon: Clock,        color: 'text-amber-600' },
    { key: 'approved', label: 'Onaylananlar', count: approvedCount, icon: CheckCircle,  color: 'text-emerald-600' },
    { key: 'rejected', label: 'Reddedilenler',count: rejectedCount, icon: XCircle,      color: 'text-red-600' },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6 text-brand-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kayıt Başvuruları</h1>
          <p className="text-slate-500 text-sm mt-0.5">Yeni klinik başvurularını incele ve onayla</p>
        </div>
        {(pendingCount ?? 0) > 0 && (
          <div className="ml-auto flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-700">{pendingCount} bekliyor</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-3">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <a
              key={tab.key}
              href={`/admin/registrations?status=${tab.key}`}
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

      {/* Liste */}
      {(registrations ?? []).length === 0 ? (
        <div className="card p-16 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Bu kategoride başvuru yok</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(registrations ?? []).map(reg => (
            <AdminRegistrationCard key={reg.id} registration={reg} />
          ))}
        </div>
      )}
    </div>
  );
}
