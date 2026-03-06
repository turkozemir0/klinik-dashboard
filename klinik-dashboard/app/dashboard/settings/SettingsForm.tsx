'use client';

import { useState, useTransition } from 'react';
import { CheckCircle } from 'lucide-react';
import type { Lang } from '@/lib/i18n/messages';

interface Props {
  currentLanguage: Lang;
  saveLanguage: (formData: FormData) => Promise<void>;
  labels: {
    turkish: string;
    english: string;
    save: string;
    saved: string;
    saving: string;
  };
}

export default function SettingsForm({ currentLanguage, saveLanguage, labels }: Props) {
  const [selected, setSelected] = useState<Lang>(currentLanguage);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaved(false);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      await saveLanguage(formData);
      setSaved(true);
      // Reload so the new language takes effect immediately
      window.location.reload();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-3">
        {/* Turkish option */}
        <label className={`flex items-center gap-3 flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all ${
          selected === 'tr'
            ? 'border-brand-500 bg-brand-50'
            : 'border-slate-200 bg-white hover:border-slate-300'
        }`}>
          <input
            type="radio"
            name="language"
            value="tr"
            checked={selected === 'tr'}
            onChange={() => setSelected('tr')}
            className="sr-only"
          />
          <span className="text-xl">🇹🇷</span>
          <span className={`text-sm font-medium ${selected === 'tr' ? 'text-brand-700' : 'text-slate-700'}`}>
            {labels.turkish}
          </span>
          {selected === 'tr' && (
            <CheckCircle className="w-4 h-4 text-brand-600 ml-auto" />
          )}
        </label>

        {/* English option */}
        <label className={`flex items-center gap-3 flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all ${
          selected === 'en'
            ? 'border-brand-500 bg-brand-50'
            : 'border-slate-200 bg-white hover:border-slate-300'
        }`}>
          <input
            type="radio"
            name="language"
            value="en"
            checked={selected === 'en'}
            onChange={() => setSelected('en')}
            className="sr-only"
          />
          <span className="text-xl">🇬🇧</span>
          <span className={`text-sm font-medium ${selected === 'en' ? 'text-brand-700' : 'text-slate-700'}`}>
            {labels.english}
          </span>
          {selected === 'en' && (
            <CheckCircle className="w-4 h-4 text-brand-600 ml-auto" />
          )}
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending || selected === currentLanguage}
          className="btn-primary"
        >
          {isPending ? labels.saving : labels.save}
        </button>
        {saved && (
          <span className="text-sm text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            {labels.saved}
          </span>
        )}
      </div>
    </form>
  );
}
