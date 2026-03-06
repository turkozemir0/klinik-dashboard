import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getLang, getT } from '@/lib/i18n';
import type { Lang } from '@/lib/i18n/messages';
import SettingsForm from './SettingsForm';

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: cu } = await supabase
    .from('clinic_users')
    .select('id, language')
    .eq('user_id', user.id)
    .single();

  if (!cu) redirect('/login');

  const lang = getLang();
  const t = getT(lang);
  const currentLanguage = ((cu as any).language ?? 'tr') as Lang;

  async function saveLanguage(formData: FormData) {
    'use server';

    const newLang = formData.get('language') as Lang;
    if (newLang !== 'tr' && newLang !== 'en') return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('clinic_users')
      .update({ language: newLang })
      .eq('user_id', user.id);

    // Set cookie so all server components immediately read the new language
    const cookieStore = cookies();
    cookieStore.set('app_lang', newLang, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });

    revalidatePath('/dashboard', 'layout');
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">{t.settings.title}</h1>
      </div>

      <div className="card p-6 space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-1">
            {t.settings.languagePreference}
          </h2>
          <p className="text-xs text-slate-400 mb-4">{t.settings.languageHint}</p>

          <SettingsForm
            currentLanguage={currentLanguage}
            saveLanguage={saveLanguage}
            labels={{
              turkish: t.settings.turkish,
              english: t.settings.english,
              save: t.settings.save,
              saved: t.settings.saved,
              saving: t.settings.saving,
            }}
          />
        </div>
      </div>
    </div>
  );
}
