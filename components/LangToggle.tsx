'use client';

import { useState, useEffect } from 'react';
import { getClientLang, setClientLang } from '@/lib/client-lang';
import type { Lang } from '@/lib/i18n/messages';

interface LangToggleProps {
  variant?: 'light' | 'dark'; // dark = on coloured/dark backgrounds
}

export default function LangToggle({ variant = 'dark' }: LangToggleProps) {
  const [lang, setLang] = useState<Lang>('tr');

  useEffect(() => {
    setLang(getClientLang());
  }, []);

  function handleClick(newLang: Lang) {
    if (newLang === lang) return;
    setClientLang(newLang);
    window.location.reload();
  }

  const base = 'px-2 py-1 text-xs rounded-lg font-medium transition-all';
  const active = variant === 'dark' ? 'bg-white/20 text-white' : 'bg-brand-100 text-brand-700';
  const inactive = variant === 'dark' ? 'text-white/60 hover:text-white/90' : 'text-slate-400 hover:text-slate-600';

  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={() => handleClick('tr')}
        className={`${base} ${lang === 'tr' ? active : inactive}`}
        title="Türkçe"
      >
        🇹🇷 TR
      </button>
      <button
        onClick={() => handleClick('en')}
        className={`${base} ${lang === 'en' ? active : inactive}`}
        title="English (UK)"
      >
        🇬🇧 EN
      </button>
    </div>
  );
}
