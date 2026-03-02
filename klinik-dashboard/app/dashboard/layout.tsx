import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/dashboard/Sidebar';
import RealtimeProvider from '@/components/dashboard/RealtimeProvider';
import type { Clinic } from '@/types';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect('/login');

  const { data: clinicUser, error: clinicError } = await supabase
    .from('clinic_users')
    .select(`
      id, role,
      clinic:clinic_id (
        id, name, slug, clinic_type, status,
        phone, email, address, district, city,
        lead_doctor_name, lead_doctor_title,
        lead_doctor_experience_years, tone_profile,
        working_hours, ghl_location_id
      )
    `)
    .eq('user_id', user.id)
    .single();

  if (clinicError || !clinicUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="card p-8 max-w-md text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Klinik Erişimi Yok</h2>
          <p className="text-slate-500 text-sm">
            Bu hesaba henüz bir klinik bağlanmamış. Lütfen sistem yöneticinizle iletişime geçin.
          </p>
        </div>
      </div>
    );
  }

  const clinic = clinicUser.clinic as unknown as Clinic;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar clinic={clinic} />
      {/* pt-14: mobil top bar yüksekliği kadar boşluk; lg'de sıfırlanır */}
      <main className="flex-1 min-w-0 overflow-auto pt-14 lg:pt-0">
        <RealtimeProvider clinicId={clinic.id} />
        {children}
      </main>
    </div>
  );
}
