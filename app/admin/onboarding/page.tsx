import { createClient } from '@/lib/supabase/server';
import AdminSubmissionCard from '@/components/admin/AdminSubmissionCard';
import { ClipboardList, Building2 } from 'lucide-react';

export default async function AdminOnboardingPage({ searchParams }: { searchParams: { clinic?: string } }) {
  const supabase = createClient();

  const { data: submissions } = await supabase
    .from('onboarding_submissions')
    .select(`*, clinic:clinic_id(id, name, email, city, clinic_types, clinic_type_other)`)
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true });

  // Klinik listesi
  const clinicMap = new Map<string, any>();
  (submissions ?? []).forEach(s => {
    if (s.clinic_id && !clinicMap.has(s.clinic_id)) clinicMap.set(s.clinic_id, s.clinic);
  });
  const clinics = Array.from(clinicMap.entries()).map(([id, c]) => ({ id, ...c }));

  const filtered = searchParams.clinic
    ? (submissions ?? []).filter(s => s.clinic_id === searchParams.clinic)
    : (submissions ?? []);

  // Klinik başına grupla
  const grouped: Record<string, any[]> = filtered.reduce((acc: Record<string, any[]>, s) => {
    if (!acc[s.clinic_id]) acc[s.clinic_id] = [];
    acc[s.clinic_id].push(s);
    return acc;
  }, {});

  const sectionLabel: Record<string, string> = {
    profile: '🏥 Klinik Profili',
    services: '💉 Hizmetler',
    faqs: '❓ SSS',
  };

  const sectionOrder: Record<string, number> = { profile: 0, services: 1, faqs: 2 };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardList className="w-6 h-6 text-brand-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Onboarding Onayları</h1>
          <p className="text-slate-500 text-sm mt-0.5">Kliniklerin gönderdiği bilgileri bölüm bölüm incele ve onayla</p>
        </div>
        {filtered.length > 0 && (
          <div className="ml-auto bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <span className="text-sm font-semibold text-amber-700">{filtered.length} bölüm bekliyor</span>
          </div>
        )}
      </div>

      {/* Klinik filtresi */}
      {clinics.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <a href="/admin/onboarding"
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              !searchParams.clinic ? 'bg-white shadow-sm border border-slate-200 text-slate-900' : 'text-slate-500 hover:bg-white'
            }`}>
            Tümü ({submissions?.length ?? 0})
          </a>
          {clinics.map(c => {
            const count = (submissions ?? []).filter(s => s.clinic_id === c.id).length;
            return (
              <a key={c.id} href={`/admin/onboarding?clinic=${c.id}`}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  searchParams.clinic === c.id ? 'bg-white shadow-sm border border-slate-200 text-slate-900' : 'text-slate-500 hover:bg-white'
                }`}>
                <Building2 className="w-3.5 h-3.5" />
                {c.name}
                <span className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full">{count}</span>
              </a>
            );
          })}
        </div>
      )}

      {Object.keys(grouped).length === 0 ? (
        <div className="card p-16 text-center">
          <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Bekleyen onboarding verisi yok</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([clinicId, subs]) => {
            const clinic = (subs[0] as any).clinic;
            const sorted = [...subs].sort((a, b) => (sectionOrder[a.section] ?? 9) - (sectionOrder[b.section] ?? 9));
            return (
              <div key={clinicId}>
                {/* Klinik başlığı */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-brand-100 rounded-2xl flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-brand-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{clinic?.name ?? 'Bilinmeyen Klinik'}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      {clinic?.city && <span className="text-xs text-slate-400">{clinic.city}</span>}
                      {clinic?.clinic_types?.length > 0 && (
                        <div className="flex gap-1">
                          {clinic.clinic_types.map((t: string) => (
                            <span key={t} className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">{t}</span>
                          ))}
                          {clinic.clinic_type_other && (
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{clinic.clinic_type_other}</span>
                          )}
                        </div>
                      )}
                      <span className="text-xs text-amber-600 font-medium">{sorted.length} bölüm bekliyor</span>
                    </div>
                  </div>
                </div>
                {/* Bu kliniğe ait submission'lar */}
                <div className="space-y-3 pl-3 border-l-2 border-brand-100">
                  {sorted.map(sub => (
                    <AdminSubmissionCard
                      key={sub.id}
                      submission={sub}
                      sectionLabel={sectionLabel[sub.section] ?? sub.section}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
