import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function OnboardingRootPage() {
  const supabase = createClient();

  const { data: cu } = await supabase
    .from('clinic_users')
    .select('clinic_id, clinic:clinic_id(onboarding_status, clinic_types)')
    .single();

  if (!cu) redirect('/onboarding/type');

  const clinic = cu.clinic as any;
  if (clinic?.onboarding_status === 'completed') redirect('/dashboard');

  // Klinik tipi seçilmemişse oraya gönder
  if (!clinic?.clinic_types?.length) redirect('/onboarding/type');

  // Submission durumlarına bak
  const { data: subs } = await supabase
    .from('onboarding_submissions')
    .select('section, status')
    .eq('clinic_id', cu.clinic_id);

  const getStatus = (section: string) => subs?.find(s => s.section === section)?.status;

  if (!getStatus('profile') || getStatus('profile') === 'rejected') redirect('/onboarding/profile');
  if (!getStatus('services') || getStatus('services') === 'rejected') redirect('/onboarding/services');
  if (!getStatus('faqs') || getStatus('faqs') === 'rejected') redirect('/onboarding/faqs');

  redirect('/onboarding/done');
}
