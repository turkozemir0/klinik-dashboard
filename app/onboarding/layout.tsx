import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CheckCircle } from 'lucide-react';

const STEPS = [
  { num: 0, label: 'Klinik Tipi', slug: 'type' },
  { num: 1, label: 'Profil',      slug: 'profile' },
  { num: 2, label: 'Hizmetler',   slug: 'services' },
  { num: 3, label: 'SSS',         slug: 'faqs' },
  { num: 4, label: 'Tamamlandı',  slug: 'done' },
];

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: cu } = await supabase
    .from('clinic_users')
    .select('clinic_id, clinic:clinic_id(name, onboarding_status, clinic_types)')
    .eq('user_id', user.id)
    .single();

  // Klinik yoksa waiting sayfasına — middleware zaten hallediyor ama guard olarak
  if (!cu) redirect('/waiting');

  const clinic = cu.clinic as any;
  if (clinic?.onboarding_status === 'completed') redirect('/dashboard');

  const { data: progress } = await supabase
    .from('onboarding_progress')
    .select('completion_pct, completed_steps')
    .eq('clinic_id', cu.clinic_id)
    .single();

  const { data: submissions } = await supabase
    .from('onboarding_submissions')
    .select('section, status')
    .eq('clinic_id', cu.clinic_id);

  const pct = progress?.completion_pct ?? 0;
  const completedSteps = progress?.completed_steps ?? [];
  const hasTypes = clinic?.clinic_types?.length > 0;

  const getStepStatus = (num: number) => {
    if (num === 0) return hasTypes ? 'done' : 'pending';
    const sectionMap: Record<number, string> = { 1: 'profile', 2: 'services', 3: 'faqs' };
    const section = sectionMap[num];
    if (!section) return completedSteps.includes(num) ? 'done' : 'pending';
    const sub = submissions?.find(s => s.section === section);
    if (!sub) return 'pending';
    if (sub.status === 'approved') return 'done';
    if (sub.status === 'pending') return 'waiting';
    if (sub.status === 'rejected') return 'rejected';
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-900 text-lg">stoaix</span>
            <span className="text-slate-300">·</span>
            <span className="text-sm text-slate-500">Klinik Kurulumu</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-sm font-semibold text-slate-600">%{pct}</span>
          </div>
        </div>
      </div>

      {/* Step tracker */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center">
            {STEPS.map((step, i) => {
              const status = getStepStatus(step.num);
              return (
                <div key={step.num} className="flex items-center flex-1">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      status === 'done'    ? 'bg-emerald-500 text-white' :
                      status === 'waiting' ? 'bg-amber-400 text-white' :
                      status === 'rejected'? 'bg-red-400 text-white' :
                      'bg-slate-200 text-slate-500'
                    }`}>
                      {status === 'done' ? <CheckCircle className="w-3.5 h-3.5" /> :
                       status === 'waiting' ? '⏳' :
                       status === 'rejected' ? '!' : step.num}
                    </div>
                    <span className={`text-xs font-medium hidden sm:block ${
                      status === 'done'    ? 'text-emerald-600' :
                      status === 'waiting' ? 'text-amber-600' :
                      status === 'rejected'? 'text-red-600' :
                      'text-slate-400'
                    }`}>{step.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${status === 'done' ? 'bg-emerald-300' : 'bg-slate-100'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {children}
      </div>
    </div>
  );
}
