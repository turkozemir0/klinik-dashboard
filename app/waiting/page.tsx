'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Clock, LogOut } from 'lucide-react';
import { getClientLang } from '@/lib/client-lang';
import { getT } from '@/lib/i18n/messages';
import type { Lang } from '@/lib/i18n/messages';
import LangToggle from '@/components/LangToggle';
import Link from 'next/link';

export default function WaitingPage() {
  const supabase = createClient();
  const [clinicName, setClinicName] = useState('');
  const [lang, setLang] = useState<Lang>('tr');

  useEffect(() => {
    setLang(getClientLang());
    supabase.from('clinic_registrations').select('clinic_name').single()
      .then(({ data }) => { if (data) setClinicName(data.clinic_name); });
  }, []);

  const t = getT(lang);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="flex justify-end mb-2">
          <LangToggle variant="light" />
        </div>
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <Clock className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-3">{t.auth.waiting.title}</h2>
        {clinicName && <p className="text-slate-500 text-sm mb-2 font-medium">{clinicName}</p>}
        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          {t.auth.waiting.description}{' '}
          <strong>{t.auth.waiting.timeframe}</strong>{' '}
          {t.auth.waiting.timeframeDesc}
        </p>
        <button
          onClick={() => supabase.auth.signOut().then(() => window.location.href = '/login')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 mx-auto transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {t.auth.waiting.signOut}
        </button>

        <div className="flex items-center justify-center gap-3 text-xs text-slate-300 mt-8">
          <Link href="/privacy-policy" className="hover:text-slate-500 transition-colors">
            {lang === 'en' ? 'Privacy' : 'Gizlilik'}
          </Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-slate-500 transition-colors">
            {lang === 'en' ? 'Terms' : 'Şartlar'}
          </Link>
          <span>·</span>
          <Link href="/cookies" className="hover:text-slate-500 transition-colors">
            {lang === 'en' ? 'Cookies' : 'Çerezler'}
          </Link>
        </div>
      </div>
    </div>
  );
}
