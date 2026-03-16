'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getClientLang } from '@/lib/client-lang';
import { getT } from '@/lib/i18n/messages';
import type { Lang } from '@/lib/i18n/messages';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [lang, setLang] = useState<Lang>('tr');

  useEffect(() => {
    setLang(getClientLang());
    const consent = document.cookie.match(/(?:^|;\s*)cookie_consent=([^;]*)/)?.[1];
    if (!consent) setVisible(true);
  }, []);

  function accept() {
    document.cookie = 'cookie_consent=accepted; path=/; max-age=31536000; SameSite=Lax';
    setVisible(false);
  }

  function decline() {
    document.cookie = 'cookie_consent=declined; path=/; max-age=31536000; SameSite=Lax';
    setVisible(false);
  }

  if (!visible) return null;

  const t = getT(lang);
  const g = t.gdpr;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-lg px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-slate-600 flex-1">
          {g.cookieBanner}{' '}
          <Link href="/cookies" className="text-brand-600 hover:underline">{g.learnMore}</Link>
        </p>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
          >
            {g.decline}
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
          >
            {g.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
